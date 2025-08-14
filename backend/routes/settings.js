const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// GET /api/settings/logo
router.get('/logo', settingsController.getLogo);

// POST /api/settings/logo
router.post('/logo', protect, checkRole(['admin']), settingsController.uploadLogo);

module.exports = router;
