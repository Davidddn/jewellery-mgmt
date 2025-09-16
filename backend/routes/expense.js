const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All expense routes require authentication
router.use(protect);

// Admin and manager can create/edit/delete expenses
router.post('/', checkRole(['admin', 'manager']), expenseController.createExpense);
router.put('/:id', checkRole(['admin', 'manager']), expenseController.updateExpense);
router.delete('/:id', checkRole(['admin', 'manager']), expenseController.deleteExpense);

// All authenticated users can view expenses
router.get('/', expenseController.getExpenses);
router.get('/analytics', expenseController.getExpenseAnalytics);
router.get('/categories', expenseController.getExpenseCategories);
router.get('/export', checkRole(['admin', 'manager']), expenseController.downloadExpenses);
router.get('/download', checkRole(['admin', 'manager']), expenseController.downloadExpenses);
router.get('/:id', expenseController.getExpenseById);

module.exports = router;
