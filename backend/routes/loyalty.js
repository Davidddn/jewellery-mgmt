const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Loyalty points management
router.get('/:customer_id', loyaltyController.getLoyaltyPoints);
router.post('/:customer_id/redeem', loyaltyController.redeemPoints);
router.post('/add-points', loyaltyController.addLoyaltyPoints);
router.get('/:customer_id/history', loyaltyController.getLoyaltyHistory);

// Loyalty analytics
router.get('/top-customers', loyaltyController.getTopLoyaltyCustomers);
router.get('/stats', loyaltyController.getLoyaltyStats);

module.exports = router; 