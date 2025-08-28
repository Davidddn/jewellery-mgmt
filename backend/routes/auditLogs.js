const express = require('express');
const router = express.Router();
const {
    getLogs,
    getAuditStats,
    getLogById,
    exportLogs
} = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Protect all routes and restrict to admin
router.use(protect, checkRole(['admin']));

router.get('/export/csv', exportLogs);
router.get('/', getLogs);
router.get('/stats', getAuditStats);
router.get('/:id', getLogById);

module.exports = router;