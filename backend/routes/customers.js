const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer, // Ensure this is imported correctly
  deleteCustomer,
  getCustomerByPhone,
} = require('../controllers/customerController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All routes below this will be protected by the auth middleware
router.use(auth);

// Routes for creating and getting all customers
router.route('/')
  .post(checkRole(['admin', 'manager', 'sales']), createCustomer)
  .get(getCustomers);

// Routes for a single customer by ID
router.route('/:id')
  .get(getCustomerById)
  // This is the line that was causing the crash (around line 19)
  .put(checkRole(['admin', 'manager']), updateCustomer) 
  .delete(checkRole(['admin']), deleteCustomer);

// Route to get customer by phone number
router.get('/phone/:phone', getCustomerByPhone);

module.exports = router;