// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Middleware for authentication

// Use controller methods for all authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', auth, authController.verifyToken); // Requires authentication
router.get('/profile', auth, authController.getProfile); // Requires authentication
router.put('/profile', auth, authController.updateProfile); // Requires authentication

module.exports = router;
