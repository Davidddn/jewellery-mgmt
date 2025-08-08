const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Protect all routes
router.use(auth);

router.route('/')
  .post(checkRole(['admin', 'sales']), createTransaction)
  .get(getTransactions);

// This is the route that was causing the crash (around line 14)
router.route('/:id')
  .get(getTransactionById)
  .put(checkRole(['admin']), updateTransaction)
  .delete(checkRole(['admin']), deleteTransaction);

module.exports = router;