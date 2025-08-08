const { Customer } = require('../models');
const { Op } = require('sequelize');

exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const { search, phone, email } = req.query;
    let where = {};
    
    if (search) {
      // Changed from $regex to Sequelize's [Op.iLike]
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    if (phone) where.phone = phone;
    if (email) where.email = email;
    
    // Changed from .find() to .findAll({ where })
    const customers = await Customer.findAll({ where });
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    // Changed from .findById() to .findByPk()
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Changed from .findByIdAndUpdate() to .update()
    const [updated] = await Customer.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const updatedCustomer = await Customer.findByPk(id);
    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Changed from .findByIdAndDelete() to .destroy()
    const deleted = await Customer.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const customer = await Customer.findOne({ where: { phone } });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, customer });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};