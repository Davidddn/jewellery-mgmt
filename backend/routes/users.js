const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// User management routes - restricted to admin
router.get('/', protect, checkRole(['admin']), userController.getAllUsers);
router.post('/', protect, checkRole(['admin']), userController.createUser);
router.put('/:id', protect, checkRole(['admin']), userController.updateUser);
router.delete('/:id', protect, checkRole(['admin']), userController.deleteUser);

module.exports = router;