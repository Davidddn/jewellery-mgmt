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
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);

// Other routes...
router.get('/', productController.getProducts);
// ...

module.exports = router;