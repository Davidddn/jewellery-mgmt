const express = require('express');
const router = express.Router();
const profitLossController = require('../controllers/profitLossController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All profit/loss routes require authentication and admin/manager role
router.use(protect, checkRole(['admin', 'manager']));

// Get comprehensive profit & loss statement
router.get('/statement', profitLossController.getProfitLossStatement);

// Get real-time profit metrics for dashboard
router.get('/realtime-metrics', profitLossController.getRealtimeProfitMetrics);

// Export profit & loss statement
router.get('/export', profitLossController.exportProfitLossStatement);

// Get expense impact analysis on profit margins
router.get('/expense-impact', profitLossController.getExpenseImpactAnalysis);

module.exports = router;
