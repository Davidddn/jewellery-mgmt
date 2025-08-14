// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Use controller methods for all authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', protect, authController.verifyToken); // Requires authentication
router.get('/profile', protect, authController.getProfile); // Requires authentication
router.put('/profile', protect, authController.updateProfile); // Requires authentication

module.exports = router;
