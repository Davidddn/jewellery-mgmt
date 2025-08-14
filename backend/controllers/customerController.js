const { Customer } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and phone are required' 
      });
    }

    // Check if customer with this phone already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer with this phone number already exists' 
      });
    }

    const customer = await Customer.create({ name, phone, email: email || '' });
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
      where[Op.or] = [
        sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
          [Op.like]: `%${search.toLowerCase()}%`
        }),
        sequelize.where(sequelize.fn('lower', sequelize.col('phone')), {
          [Op.like]: `%${search.toLowerCase()}%`
        }),
        sequelize.where(sequelize.fn('lower', sequelize.col('email')), {
          [Op.like]: `%${search.toLowerCase()}%`
        }),
      ];
    }
    
    if (phone) where.phone = phone;
    if (email) where.email = email;
    
    const customers = await Customer.findAll({ where });
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NEW: Search customers endpoint specifically for Sales component
exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query; // Using 'q' parameter as expected by Sales component
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const searchTerm = q.toString().trim();
    
    // Check if search term is numeric (likely a phone number)
    const isNumeric = /^\d+$/.test(searchTerm);
    
    let whereClause;
    
    if (isNumeric) {
      // If it's numeric, prioritize phone search but also include name search
      whereClause = {
        [Op.or]: [
          { phone: { [Op.like]: `%${searchTerm}%` } },
          sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          }),
          sequelize.where(sequelize.fn('lower', sequelize.col('email')), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          })
        ]
      };
    } else {
      // If it's text, prioritize name search but also include phone/email
      whereClause = {
        [Op.or]: [
          sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          }),
          { phone: { [Op.like]: `%${searchTerm}%` } },
          sequelize.where(sequelize.fn('lower', sequelize.col('email')), {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          })
        ]
      };
    }

    const customers = await Customer.findAll({
      where: whereClause,
      limit: 10, // Limit results to prevent large responses
      order: [
        // Order by exact matches first, then partial matches
        [sequelize.literal(`CASE 
          WHEN phone = '${searchTerm}' THEN 1 
          WHEN LOWER(name) = '${searchTerm.toLowerCase()}' THEN 2
          WHEN phone LIKE '${searchTerm}%' THEN 3
          WHEN LOWER(name) LIKE '${searchTerm.toLowerCase()}%' THEN 4
          ELSE 5 
        END`), 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      success: true,
      customers: customers
    });
  } catch (err) {
    console.error('Error searching customers:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
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
    
    // Try exact match first
    let customer = await Customer.findOne({ where: { phone } });
    
    // If no exact match and it's not numeric, try partial phone search
    if (!customer) {
      customer = await Customer.findOne({ 
        where: { 
          phone: { [Op.like]: `%${phone}%` } 
        } 
      });
    }
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// NEW: Get customer by email
exports.getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ where: { email } });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let createdCount = 0;
      let updatedCount = 0;

      for (const item of results) {
        const { phone, ...customerData } = item;

        try {
          const [customer, created] = await Customer.findOrCreate({
            where: { phone },
            defaults: customerData,
          });

          if (created) {
            createdCount++;
          } else {
            await customer.update(customerData);
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error processing phone ${phone}:`, error);
        }
      }

      fs.unlinkSync(filePath); // Clean up the uploaded file
      res.status(200).json({ 
        success: true, 
        message: 'CSV processed successfully.',
        created: createdCount,
        updated: updatedCount,
      });
    });
};