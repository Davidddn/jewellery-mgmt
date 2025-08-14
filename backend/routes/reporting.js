const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All report routes are protected for admins and managers
router.use(protect, checkRole(['admin', 'manager', 'sales', 'inventory']));

// --- Data routes for dashboard and report pages ---
router.get('/daily-sales', reportingController.dailySalesDashboard);
router.get('/sales-analytics', reportingController.getSalesAnalytics);
router.get('/inventory', reportingController.getInventoryReports);
router.get('/customer-analytics', reportingController.getCustomerAnalytics);
router.get('/gold-rate', reportingController.getGoldRate);

// --- Download routes ---
router.get('/download/sales', reportingController.downloadSalesReport);
router.get('/download/inventory', reportingController.downloadInventoryReport);
router.get('/download/customers', reportingController.downloadCustomerReport);

module.exports = router;
