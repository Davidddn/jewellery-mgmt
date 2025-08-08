const express = require('express');
const router = express.Router();
const {
    getLoyaltyPoints,
    redeemPoints,
    addLoyaltyPoints,
    getLoyaltyHistory
} = require('../controllers/loyaltyController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Protect all routes
router.use(auth);

// This is the route that was likely causing the crash (around line 12)
router.post('/add', checkRole(['admin', 'manager']), addLoyaltyPoints);
router.post('/redeem/:customer_id', checkRole(['admin', 'sales']), redeemPoints);

router.get('/:customer_id', getLoyaltyPoints);
router.get('/history/:customer_id', getLoyaltyHistory);

module.exports = router;