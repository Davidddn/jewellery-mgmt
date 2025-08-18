const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Import 'protect' instead of 'auth'

// Import controller functions
const {
  generateInvoice,
  downloadInvoice,
  previewInvoice,
  generateCSV
} = require('../controllers/invoiceController');

// Generate invoice (PDF or HTML)
router.get('/:id', protect, generateInvoice);

// Download invoice as PDF
router.get('/:id/download', protect, downloadInvoice);

// Preview invoice as HTML
router.get('/:id/preview', protect, previewInvoice);

// Add CSV route
router.get('/:id/csv', protect, generateCSV);

module.exports = router;