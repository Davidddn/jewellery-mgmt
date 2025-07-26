const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// All routes require authentication
router.use(auth);

// Product CRUD operations
router.post('/', auditLogger, productController.createProduct);
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);
router.put('/:id', auditLogger, productController.updateProduct);
router.delete('/:id', auditLogger, productController.deleteProduct);

// Stock management
router.put('/:id/stock', auditLogger, productController.updateStock);
router.get('/low-stock', productController.getLowStockProducts);

module.exports = router; 