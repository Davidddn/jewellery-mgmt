const express = require('express');
const router = express.Router();
const { getGoldRates, updateGoldRates } = require('../controllers/goldRateController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.route('/')
    .get(getGoldRates)
    .post(auth, checkRole(['admin', 'manager']), updateGoldRates);

module.exports = router;
