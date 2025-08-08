const express = require('express');
const router = express.Router();
const {
    scanItem,
    getLowStockProducts,
    updateStock,
    getInventorySummary
} = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Protect all routes
router.use(auth);

// This is the route that was likely causing the crash (around line 14)
router.post('/scan', checkRole(['admin', 'inventory', 'sales']), scanItem);

router.get('/low-stock', checkRole(['admin', 'inventory', 'manager']), getLowStockProducts);

router.get('/summary', checkRole(['admin', 'manager']), getInventorySummary);

router.patch('/stock/:id', checkRole(['admin', 'inventory']), updateStock);

module.exports = router;