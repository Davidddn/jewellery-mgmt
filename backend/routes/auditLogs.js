const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Audit logs
router.get('/', auditLogController.getLogs);
router.get('/user/:user_id', auditLogController.getLogsByUser);
router.get('/entity/:entity/:entity_id', auditLogController.getLogsByEntity);

// Audit analytics
router.get('/stats', auditLogController.getAuditStats);
router.get('/export', auditLogController.exportLogs);

module.exports = router; 