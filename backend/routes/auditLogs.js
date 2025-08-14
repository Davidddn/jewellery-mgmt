const express = require('express');
const router = express.Router();
const {
    getLogs,
    getAuditStats
} = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Protect all routes and restrict to admin
router.use(protect, checkRole(['admin']));

// This is the route that was causing the crash (around line 11)
router.get('/', getLogs);
router.get('/stats', getAuditStats);

module.exports = router;