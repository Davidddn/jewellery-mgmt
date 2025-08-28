const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const upload = require('../middleware/upload'); // We will create this middleware
const { protect, authorize } = require('../middleware/auth');

// Protect all import routes
router.use(protect);

// Import Products from CSV
router.post('/products', authorize(['admin', 'manager']), upload.single('file'), importController.importProducts);


// Import Customers from CSV
router.post('/customers', authorize(['admin', 'manager']), upload.single('file'), importController.importCustomers);

// Import Transactions from CSV
router.post('/transactions', authorize(['admin', 'manager']), upload.single('file'), importController.importTransactions);

module.exports = router;
