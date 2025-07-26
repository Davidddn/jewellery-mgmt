const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Dashboard and analytics
router.get('/dashboard', reportingController.dailySalesDashboard);
router.get('/sales-report', reportingController.getSalesReport);
router.get('/gold-prices', reportingController.getGoldPriceTrends);
router.get('/customer-analytics', reportingController.getCustomerAnalytics);
router.get('/inventory-report', reportingController.getInventoryReport);
router.get('/daily-sales', reportingController.dailySalesDashboard);

module.exports = router; 