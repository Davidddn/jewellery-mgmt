const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Apply the middleware to your create and update routes
// 'image' should match the name attribute in your FormData
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'back_image', maxCount: 1 }]), productController.createProduct);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'back_image', maxCount: 1 }]), productController.updateProduct);
router.post('/upload/csv', upload.single('csv'), productController.uploadCSV);

// Other routes...
router.get('/search', productController.searchProducts);
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/sku/:sku', productController.getProductBySku);
router.delete('/:id', productController.deleteProduct);

module.exports = router;