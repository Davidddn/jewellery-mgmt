const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// User management routes - restricted to admin
router.get('/', auth, checkRole(['admin']), userController.getAllUsers);
router.post('/', auth, checkRole(['admin']), userController.createUser);
router.put('/:id', auth, checkRole(['admin']), userController.updateUser);
router.delete('/:id', auth, checkRole(['admin']), userController.deleteUser);

module.exports = router;