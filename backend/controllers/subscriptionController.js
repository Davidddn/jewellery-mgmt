const { Subscription, User, Product, Transaction } = require('../models');
const { PRICING_PLANS, PROMOTIONAL_OFFERS } = require('../config/pricingPlans');
const { Op } = require('sequelize');

/**
 * Subscription Management Controller
 * Handles competitive pricing models and subscription lifecycle
 */

// Get current user's subscription details
exports.getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }]
    });

    if (!subscription) {
      // Create default freemium subscription for new users
      const newSubscription = await Subscription.create({
        user_id: req.user.id,
        tier: 'freemium',
        status: 'active',
        starts_at: new Date()
      });

      return res.json({
        success: true,
        subscription: {
          ...newSubscription.toJSON(),
          plan_details: PRICING_PLANS.freemium,
          features: newSubscription.getFeatureAccess(),
          is_active: newSubscription.isActive()
        }
      });
    }

    const planDetails = PRICING_PLANS[subscription.tier];
    
    res.json({
      success: true,
      subscription: {
        ...subscription.toJSON(),
        plan_details: planDetails,
        features: subscription.getFeatureAccess(),
        is_active: subscription.isActive(),
        usage: await getUsageStats(req.user.id)
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details',
      error: error.message
    });
  }
};

// Get all available pricing plans
exports.getPricingPlans = async (req, res) => {
  try {
    const { include_promotions = false } = req.query;
    
    const plans = Object.keys(PRICING_PLANS).map(key => ({
      id: key,
      ...PRICING_PLANS[key]
    }));

    const response = {
      success: true,
      plans
    };

    if (include_promotions) {
      response.promotions = PROMOTIONAL_OFFERS;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans',
      error: error.message
    });
  }
};

// Upgrade/change subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { tier, billing_cycle, payment_reference, promo_code } = req.body;

    // Validate tier
    if (!PRICING_PLANS[tier]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier'
      });
    }

    const planDetails = PRICING_PLANS[tier];
    let subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      subscription = await Subscription.create({
        user_id: req.user.id,
        tier: 'freemium',
        status: 'active'
      });
    }

    // Calculate pricing with promotions
    const pricing = calculatePricing(tier, billing_cycle, promo_code);
    
    // Set expiration date based on billing cycle
    let expiresAt = null;
    if (billing_cycle === 'monthly') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (billing_cycle === 'yearly') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
    } // lifetime and pay_per_use have no expiration

    // Update subscription
    await subscription.update({
      tier,
      billing_cycle,
      amount_paid: pricing.final_amount,
      expires_at: expiresAt,
      last_payment_date: new Date(),
      next_billing_date: billing_cycle === 'monthly' ? expiresAt : null,
      payment_reference,
      status: 'active'
    });

    // For pay-per-use, add credits
    if (tier === 'pay_per_use' && req.body.credits) {
      await subscription.update({
        credits: subscription.credits + parseInt(req.body.credits)
      });
    }

    res.json({
      success: true,
      message: `Successfully upgraded to ${planDetails.name}`,
      subscription: {
        ...subscription.toJSON(),
        plan_details: planDetails,
        features: subscription.getFeatureAccess(),
        pricing
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

// Check subscription limits before operations
exports.checkLimits = async (req, res) => {
  try {
    const { operation } = req.query; // 'add_product', 'create_transaction'
    
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const usage = await getUsageStats(req.user.id);
    const features = subscription.getFeatureAccess();

    let canProceed = true;
    let message = '';
    let upgrade_suggestions = [];

    if (operation === 'add_product') {
      if (subscription.hasReachedProductLimit(usage.product_count)) {
        canProceed = false;
        message = `Product limit reached (${features.max_products}). Please upgrade your plan.`;
        upgrade_suggestions = getSuggestedUpgrades(subscription.tier, 'products');
      }
    } else if (operation === 'create_transaction') {
      if (subscription.tier === 'pay_per_use' && !subscription.hasTransactionCredits()) {
        canProceed = false;
        message = 'No transaction credits remaining. Please purchase more credits.';
        upgrade_suggestions = [
          { tier: 'starter', message: 'Switch to monthly plan for unlimited transactions' }
        ];
      } else if (features.max_transactions_per_month !== -1 && 
                 usage.monthly_transactions >= features.max_transactions_per_month) {
        canProceed = false;
        message = `Monthly transaction limit reached (${features.max_transactions_per_month}). Please upgrade your plan.`;
        upgrade_suggestions = getSuggestedUpgrades(subscription.tier, 'transactions');
      }
    }

    res.json({
      success: true,
      can_proceed: canProceed,
      message,
      current_usage: usage,
      limits: features,
      upgrade_suggestions
    });

  } catch (error) {
    console.error('Error checking limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription limits',
      error: error.message
    });
  }
};

// Consume credits/usage (for pay-per-use and tracking)
exports.consumeUsage = async (req, res) => {
  try {
    const { operation, amount = 1 } = req.body; // 'transaction', 'product'
    
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (operation === 'transaction') {
      // For pay-per-use, deduct credits
      if (subscription.tier === 'pay_per_use') {
        if (subscription.credits < amount) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient transaction credits'
          });
        }
        
        await subscription.update({
          credits: subscription.credits - amount
        });
      }

      // Update monthly transaction count
      await subscription.update({
        monthly_transaction_count: subscription.monthly_transaction_count + amount
      });
    } else if (operation === 'product') {
      // Update product count
      await subscription.update({
        current_product_count: subscription.current_product_count + amount
      });
    }

    res.json({
      success: true,
      message: 'Usage updated successfully',
      remaining_credits: subscription.credits,
      current_usage: await getUsageStats(req.user.id)
    });

  } catch (error) {
    console.error('Error consuming usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update usage',
      error: error.message
    });
  }
};

// Purchase credits for pay-per-use model
exports.purchaseCredits = async (req, res) => {
  try {
    const { credits, payment_reference } = req.body;
    
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id }
    });

    if (!subscription || subscription.tier !== 'pay_per_use') {
      return res.status(400).json({
        success: false,
        message: 'Credit purchase only available for pay-per-use subscriptions'
      });
    }

    // Calculate pricing for credits
    const costPerCredit = PRICING_PLANS.pay_per_use.price;
    const totalCost = credits * costPerCredit;
    
    // Apply bulk discounts if applicable
    const bulkPackages = PRICING_PLANS.pay_per_use.cost_structure.bulk_packages;
    let finalCost = totalCost;
    
    for (const package of bulkPackages) {
      if (credits >= package.transactions) {
        finalCost = package.price;
        break;
      }
    }

    // Update subscription with new credits
    await subscription.update({
      credits: subscription.credits + credits,
      amount_paid: subscription.amount_paid + finalCost,
      last_payment_date: new Date(),
      payment_reference
    });

    res.json({
      success: true,
      message: `Successfully purchased ${credits} transaction credits`,
      total_cost: finalCost,
      credits_added: credits,
      total_credits: subscription.credits
    });

  } catch (error) {
    console.error('Error purchasing credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase credits',
      error: error.message
    });
  }
};

// Get subscription analytics for admin
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const analytics = await getSubscriptionAnalytics();
    
    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription analytics',
      error: error.message
    });
  }
};

// Helper functions
async function getUsageStats(userId) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const [productCount, monthlyTransactions] = await Promise.all([
    Product.count({ where: { user_id: userId } }),
    Transaction.count({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: currentMonth }
      }
    })
  ]);

  return {
    product_count: productCount,
    monthly_transactions: monthlyTransactions
  };
}

function calculatePricing(tier, billingCycle, promoCode) {
  const plan = PRICING_PLANS[tier];
  let basePrice = plan.price;
  
  // Use yearly price if available and billing is yearly
  if (billingCycle === 'yearly' && plan.yearly_price) {
    basePrice = plan.yearly_price;
  }

  let discount = 0;
  let discountReason = '';

  // Apply promotional codes
  if (promoCode) {
    const promo = Object.values(PROMOTIONAL_OFFERS).find(
      offer => offer.code === promoCode && offer.applicable_plans.includes(tier)
    );
    
    if (promo) {
      discount = (basePrice * promo.discount_percentage) / 100;
      discountReason = promo.name;
    }
  }

  return {
    base_price: basePrice,
    discount,
    discount_reason: discountReason,
    final_amount: basePrice - discount
  };
}

function getSuggestedUpgrades(currentTier, limitType) {
  const tiers = ['freemium', 'starter', 'professional', 'enterprise', 'lifetime'];
  const currentIndex = tiers.indexOf(currentTier);
  
  const suggestions = [];
  
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tierPlan = PRICING_PLANS[tiers[i]];
    const features = tierPlan.features;
    
    if (limitType === 'products' && features.max_products > PRICING_PLANS[currentTier].features.max_products) {
      suggestions.push({
        tier: tiers[i],
        name: tierPlan.name,
        price: tierPlan.price,
        message: `Upgrade to ${tierPlan.name} for ${features.max_products === -1 ? 'unlimited' : features.max_products} products`
      });
    } else if (limitType === 'transactions' && features.max_transactions_per_month > PRICING_PLANS[currentTier].features.max_transactions_per_month) {
      suggestions.push({
        tier: tiers[i],
        name: tierPlan.name,
        price: tierPlan.price,
        message: `Upgrade to ${tierPlan.name} for ${features.max_transactions_per_month === -1 ? 'unlimited' : features.max_transactions_per_month} transactions/month`
      });
    }
  }
  
  return suggestions.slice(0, 2); // Return top 2 suggestions
}

async function getSubscriptionAnalytics() {
  const totalSubscriptions = await Subscription.count();
  
  const tierDistribution = await Subscription.findAll({
    attributes: [
      'tier',
      [Subscription.sequelize.fn('COUNT', Subscription.sequelize.col('tier')), 'count']
    ],
    group: ['tier']
  });

  const revenueByTier = await Subscription.findAll({
    attributes: [
      'tier',
      [Subscription.sequelize.fn('SUM', Subscription.sequelize.col('amount_paid')), 'revenue']
    ],
    group: ['tier']
  });

  const activeSubscriptions = await Subscription.count({
    where: { status: 'active' }
  });

  return {
    total_subscriptions: totalSubscriptions,
    active_subscriptions: activeSubscriptions,
    tier_distribution: tierDistribution,
    revenue_by_tier: revenueByTier
  };
}
