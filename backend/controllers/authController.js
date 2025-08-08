const { User } = require('../models');
const { Op } = require('sequelize'); // Import Sequelize operators
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Correctly check for an existing user with Sequelize syntax
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // The User model's 'beforeCreate' hook handles hashing
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'sales'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send user data without sensitive information
    const userData = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email
    };

    res.json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    // Use the correct 'update' and 'findByPk' methods
    const [updatedRows] = await User.update(
      { firstName, lastName, phone },
      { where: { id: req.user.id } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedUser = await User.findByPk(req.user.id);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.verifyToken = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
  res.json({ success: true, user: req.user.toJSON() });
};