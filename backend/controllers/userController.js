const { User } = require('../models');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const { name, role, status } = req.query;
    const whereClause = {};

    if (name) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${name}%` } },
        { lastName: { [Op.iLike]: `%${name}%` } },
        { username: { [Op.iLike]: `%${name}%` } }
      ];
    }

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (status && status !== 'all') {
      whereClause.is_active = status === 'active';
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['firstName', 'ASC']]
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { firstName, lastName, username, email, password, phone, role, is_active } = req.body;
  try {
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      role,
      is_active
    });
    res.status(201).json({ success: true, message: 'User created successfully', user: user.toJSON() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, username, email, phone, role, is_active, password } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.role = role;
    user.is_active = is_active;

    // Only update password if a new one is provided
    if (password) {
      user.password = password; // The 'beforeUpdate' hook in the model will hash it
    }

    await user.save();
    res.json({ success: true, message: 'User updated successfully', user: user.toJSON() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
