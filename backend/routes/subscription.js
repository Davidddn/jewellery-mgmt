const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

/**
 * Subscription Management Routes
 * Handles competitive pricing models and subscription lifecycle
 */

// Apply authentication middleware to all routes
router.use(protect);

// Get current user's subscription details
router.get('/current', subscriptionController.getCurrentSubscription);

// Get all available pricing plans
router.get('/plans', subscriptionController.getPricingPlans);

// Check subscription limits before operations
router.get('/limits', subscriptionController.checkLimits);

// Upgrade/change subscription
router.post('/upgrade', subscriptionController.updateSubscription);

// Consume usage/credits
router.post('/consume', subscriptionController.consumeUsage);

// Purchase credits for pay-per-use model
router.post('/credits', subscriptionController.purchaseCredits);

// Subscription analytics (admin only)
router.get('/analytics', subscriptionController.getSubscriptionAnalytics);

module.exports = router;
