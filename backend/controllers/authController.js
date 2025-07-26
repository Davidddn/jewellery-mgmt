const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, phone, biometricId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'sales',
      phone,
      biometricId
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password, biometricId } = req.body;
    
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    // Biometric login
    if (biometricId && user.biometricId === biometricId) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Update last login
      user.lastLogin = new Date();
      user.loginAttempts = 0;
      await user.save();

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: user.toJSON()
      });
    }

    // Password login
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, biometricId } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      firstName,
      lastName,
      phone,
      biometricId
    });

    const updatedUser = await User.findById(req.user._id);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
  exports.verifyToken = async (req, res) => {
    try {
      // The auth middleware already verified the token and attached the user
      // So we just need to return the user data
      res.json({
        success: true,
        user: req.user.toJSON()
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  };
}; 