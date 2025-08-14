const express = require('express');
const router = express.Router();
const { getGoldRates, updateGoldRates, resetGoldRates } = require('../controllers/goldRateController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.get('/', getGoldRates);
router.post('/', protect, checkRole(['admin', 'manager']), updateGoldRates);
router.delete('/reset', protect, checkRole(['admin']), resetGoldRates);

module.exports = router;