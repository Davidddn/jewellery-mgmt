const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const upload = require('../middleware/upload'); // We will create this middleware
const { protect, authorize } = require('../middleware/auth');

// Protect all import routes
router.use(protect);

// Import Products from CSV
router.post('/products', authorize(['admin', 'manager']), upload.single('file'), importController.importProducts);

// TODO: Add routes for transactions and customers import

module.exports = router;
