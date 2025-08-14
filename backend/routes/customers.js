const express = require('express');
const router = express.Router();
const multer = require('multer');
const customerController = require('../controllers/customerController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Search customers - THIS IS THE KEY ROUTE for your Sales component
router.get('/search', customerController.searchCustomers);

// Get all customers
router.get('/', customerController.getCustomers);

// Get customer by phone
router.get('/phone/:phone', customerController.getCustomerByPhone);

// Get customer by email
router.get('/email/:email', customerController.getCustomerByEmail);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Create new customer
router.post('/', customerController.createCustomer);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

router.post('/upload/csv', upload.single('csv'), customerController.uploadCSV);

module.exports = router;