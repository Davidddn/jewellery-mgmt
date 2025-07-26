const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// All routes require authentication
router.use(auth);

// Customer CRUD operations
router.post('/', auditLogger, customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', auditLogger, customerController.updateCustomer);
router.delete('/:id', auditLogger, customerController.deleteCustomer);

// Customer preferences
router.put('/:id/preferences', auditLogger, customerController.updateCustomerPreferences);

module.exports = router; 