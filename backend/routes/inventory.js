const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Barcode/RFID scanning
router.post('/scan', inventoryController.scanItem);

// Stock management
router.get('/low-stock', inventoryController.getLowStockProducts);
router.post('/making-charge', inventoryController.calculateMakingCharge);
router.put('/stock/:id', inventoryController.updateStock);
router.post('/bulk-update', inventoryController.bulkUpdateStock);

// Inventory summary
router.get('/summary', inventoryController.getInventorySummary);

module.exports = router; 