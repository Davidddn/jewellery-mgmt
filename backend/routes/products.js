const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect: auth } = require('../middleware/auth'); // FIX: Use destructuring

// Debug the imports
console.log('productController.exportExcel:', typeof productController.exportExcel);
console.log('auth middleware:', typeof auth);

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================
router.get('/search', productController.searchProducts);
router.get('/tags', productController.getAllTags);
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/sku/:sku', productController.getProductBySku);
router.get('/:id', productController.getProductById);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

// Export routes
router.get('/export/csv', auth, productController.exportCSV);
router.get('/export/excel', auth, productController.exportExcel);

// CRUD operations
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

// Image management
router.post('/:id/images', auth, productController.uploadImages);
router.delete('/:id/images/:imageType', auth, productController.deleteImage);

// Data import
router.post('/upload/csv', auth, productController.uploadCSV);

module.exports = router;