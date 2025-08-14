const express = require('express');
const router = express.Router();
const hallmarkingController = require('../controllers/hallmarkingController');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Hallmarking CRUD operations
router.post('/', auditLogger, hallmarkingController.createHallmarking);
router.get('/', hallmarkingController.getAllHallmarking);
router.get('/product/:product_id', hallmarkingController.getHallmarkingByProduct);
router.put('/:id', auditLogger, hallmarkingController.updateHallmarking);
router.delete('/:id', auditLogger, hallmarkingController.deleteHallmarking);

// Hallmarking verification
router.get('/verify/:bis_certificate_no', hallmarkingController.verifyHallmarking);

module.exports = router; 