const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// All routes require authentication
router.use(auth);

// Transaction CRUD operations
router.post('/', auditLogger, transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', auditLogger, transactionController.updateTransaction);
router.delete('/:id', auditLogger, transactionController.deleteTransaction);

// Special transaction operations
router.post('/:id/return', auditLogger, transactionController.processReturn);
router.get('/stats/summary', transactionController.getTransactionStats);

module.exports = router; 