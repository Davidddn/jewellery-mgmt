
const express = require('express');
const router = express.Router();
const goldRateController = require('../controllers/goldRateController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.post('/', protect, checkRole(['admin']), goldRateController.createGoldRate);
router.get('/latest', protect, goldRateController.getLatestGoldRate);

module.exports = router;
