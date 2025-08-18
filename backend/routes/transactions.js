const express = require('express');
const router = express.Router();
const multer = require('multer');
const transactionController = require('../controllers/transactionController');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  uploadCSV,
} = transactionController;
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Protect all routes
router.use(protect);

router.route('/')
  .post(checkRole(['admin', 'sales']), createTransaction)
  .get(getTransactions);

router.post('/upload/csv', upload.single('csv'), uploadCSV);
router.get('/export/csv', transactionController.exportCSV);

// This is the route that was causing the crash (around line 14)
router.route('/:id')
  .get(getTransactionById)
  .put(checkRole(['admin']), updateTransaction)
  .delete(checkRole(['admin']), deleteTransaction);

router.get('/:id/invoice', transactionController.getInvoice);

module.exports = router;