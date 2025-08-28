const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect: auth } = require('../middleware/auth'); // FIX: Use destructuring
const upload = require('../middleware/upload');

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
router.get('/low-stock', productController.getLowStockProducts);
router.get('/realtime-stats', productController.getRealtimeStats);
router.get('/:id', productController.getProductById);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

// Export routes
router.get('/export/csv', auth, productController.exportCSV);
router.get('/export/excel', auth, productController.exportExcel);

// CRUD operations
router.post('/', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'back_image', maxCount: 1 }]), productController.createProduct);
router.put('/:id', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'back_image', maxCount: 1 }]), productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

// Image management
router.post('/:id/images', auth, upload.array('images', 5), productController.uploadImages);
router.delete('/:id/images/:imageType', auth, productController.deleteImage);

// Data import
router.post('/upload/csv', auth, upload.single('csv'), productController.uploadCSV);

module.exports = router;