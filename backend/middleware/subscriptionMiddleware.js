const { Subscription, Product, Transaction } = require('../models');
const { PRICING_PLANS } = require('../config/pricingPlans');
const { Op } = require('sequelize');

/**
 * Subscription Limit Enforcement Middleware
 * Enforces feature limits based on subscription tiers
 */

// Check product limits before adding/importing products
const checkProductLimits = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      // Auto-create freemium subscription for new users
      const newSubscription = await Subscription.create({
        user_id: req.user.id,
        tier: 'freemium',
        status: 'active',
        starts_at: new Date()
      });
      req.subscription = newSubscription;
    } else {
      req.subscription = subscription;
    }

    const currentProductCount = await Product.count({
      where: { user_id: req.user.id }
    });

    if (subscription.hasReachedProductLimit(currentProductCount)) {
      const planDetails = PRICING_PLANS[subscription.tier];
      return res.status(403).json({
        success: false,
        message: `Product limit reached (${planDetails.features.max_products}). Please upgrade your plan.`,
        limit_type: 'products',
        current_count: currentProductCount,
        max_allowed: planDetails.features.max_products,
        upgrade_suggestions: getSuggestedUpgrades(subscription.tier, 'products')
      });
    }

    next();
  } catch (error) {
    console.error('Error checking product limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription limits',
      error: error.message
    });
  }
};

// Check transaction limits and credits before creating transactions
const checkTransactionLimits = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    req.subscription = subscription;

    // Check if subscription is active
    if (!subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired. Please renew your plan.',
        subscription_status: subscription.status,
        expires_at: subscription.expires_at
      });
    }

    const features = subscription.getFeatureAccess();

    // For pay-per-use model, check credits
    if (subscription.tier === 'pay_per_use') {
      if (!subscription.hasTransactionCredits()) {
        return res.status(403).json({
          success: false,
          message: 'No transaction credits remaining. Please purchase more credits.',
          limit_type: 'credits',
          current_credits: subscription.credits,
          upgrade_suggestions: [
            {
              tier: 'starter',
              name: 'Starter Plan',
              price: PRICING_PLANS.starter.price,
              message: 'Switch to monthly plan for unlimited transactions'
            }
          ]
        });
      }
    }

    // Check monthly transaction limits for other tiers
    if (features.max_transactions_per_month !== -1) {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyTransactions = await Transaction.count({
        where: {
          user_id: req.user.id,
          created_at: { [Op.gte]: currentMonth }
        }
      });

      if (monthlyTransactions >= features.max_transactions_per_month) {
        return res.status(403).json({
          success: false,
          message: `Monthly transaction limit reached (${features.max_transactions_per_month}). Please upgrade your plan.`,
          limit_type: 'transactions',
          current_count: monthlyTransactions,
          max_allowed: features.max_transactions_per_month,
          upgrade_suggestions: getSuggestedUpgrades(subscription.tier, 'transactions')
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking transaction limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription limits',
      error: error.message
    });
  }
};

// Check feature access (for premium features)
const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: req.user.id }
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      const features = subscription.getFeatureAccess();

      if (!features[featureName]) {
        const planDetails = PRICING_PLANS[subscription.tier];
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' is not available in your current plan (${planDetails.name}).`,
          feature: featureName,
          current_plan: planDetails.name,
          upgrade_suggestions: getSuggestedUpgrades(subscription.tier, featureName)
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check feature access',
        error: error.message
      });
    }
  };
};

// Check storage limits for file uploads
const checkStorageLimits = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const features = subscription.getFeatureAccess();
    
    if (features.max_storage_gb !== -1) {
      // Calculate current storage usage
      const currentStorageGB = await calculateStorageUsage(req.user.id);
      
      if (currentStorageGB >= features.max_storage_gb) {
        return res.status(403).json({
          success: false,
          message: `Storage limit reached (${features.max_storage_gb}GB). Please upgrade your plan.`,
          limit_type: 'storage',
          current_usage_gb: currentStorageGB,
          max_allowed_gb: features.max_storage_gb,
          upgrade_suggestions: getSuggestedUpgrades(subscription.tier, 'storage')
        });
      }
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking storage limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check storage limits',
      error: error.message
    });
  }
};

// Middleware to auto-consume usage after successful operations
const consumeUsage = (operationType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only consume usage if operation was successful
      if (data && data.success !== false) {
        consumeUsageAsync(req.user.id, operationType, req.subscription)
          .catch(error => console.error('Error consuming usage:', error));
      }
      
      // Call original res.json
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Helper function to consume usage asynchronously
const consumeUsageAsync = async (userId, operationType, subscription) => {
  try {
    if (!subscription) {
      subscription = await Subscription.findOne({
        where: { user_id: userId }
      });
    }

    if (!subscription) return;

    if (operationType === 'transaction') {
      // For pay-per-use, deduct credits
      if (subscription.tier === 'pay_per_use') {
        await subscription.update({
          credits: Math.max(0, subscription.credits - 1)
        });
      }

      // Update monthly transaction count
      await subscription.update({
        monthly_transaction_count: subscription.monthly_transaction_count + 1
      });
    } else if (operationType === 'product') {
      // Update product count
      await subscription.update({
        current_product_count: subscription.current_product_count + 1
      });
    }
  } catch (error) {
    console.error('Error in consumeUsageAsync:', error);
  }
};

// Helper functions
const getSuggestedUpgrades = (currentTier, limitType) => {
  const tiers = ['freemium', 'starter', 'professional', 'enterprise', 'lifetime'];
  const currentIndex = tiers.indexOf(currentTier);
  
  const suggestions = [];
  
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tierPlan = PRICING_PLANS[tiers[i]];
    const features = tierPlan.features;
    
    let shouldSuggest = false;
    let message = '';

    if (limitType === 'products' && features.max_products > PRICING_PLANS[currentTier].features.max_products) {
      shouldSuggest = true;
      message = `Upgrade for ${features.max_products === -1 ? 'unlimited' : features.max_products} products`;
    } else if (limitType === 'transactions' && features.max_transactions_per_month > PRICING_PLANS[currentTier].features.max_transactions_per_month) {
      shouldSuggest = true;
      message = `Upgrade for ${features.max_transactions_per_month === -1 ? 'unlimited' : features.max_transactions_per_month} transactions/month`;
    } else if (limitType === 'storage' && features.max_storage_gb > PRICING_PLANS[currentTier].features.max_storage_gb) {
      shouldSuggest = true;
      message = `Upgrade for ${features.max_storage_gb === -1 ? 'unlimited' : features.max_storage_gb + 'GB'} storage`;
    }

    if (shouldSuggest) {
      suggestions.push({
        tier: tiers[i],
        name: tierPlan.name,
        price: tierPlan.price,
        message
      });
    }
  }
  
  return suggestions.slice(0, 2); // Return top 2 suggestions
};

const calculateStorageUsage = async (userId) => {
  // This would calculate actual file storage usage
  // For now, return a placeholder value
  // In a real implementation, you would:
  // 1. Get all file uploads for the user
  // 2. Sum up file sizes
  // 3. Convert to GB
  return 0.1; // Placeholder: 0.1 GB
};

module.exports = {
  checkProductLimits,
  checkTransactionLimits,
  checkFeatureAccess,
  checkStorageLimits,
  consumeUsage
};
