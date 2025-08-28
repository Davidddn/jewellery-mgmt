const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/invoiceTemplateController');

// All routes in this file should be protected
router.use(protect);

router.get('/', ctrl.getTemplates);
router.get('/:name', ctrl.getTemplate);
router.post('/', ctrl.saveTemplate);
router.delete('/:name', ctrl.deleteTemplate);
router.post('/reset', ctrl.resetTemplate);

module.exports = router;