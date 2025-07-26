const { sequelize } = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

async function setupDatabase() {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    logger.info('Database synchronized successfully');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@jewellery.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+919876543210'
    });
    logger.info('Admin user created');

    // Create sample products
    const sampleProducts = [
      {
        barcode: 'GOLD001',
        name: '22K Gold Chain',
        category: 'gold',
        weight: 10.5,
        purity: '22K',
        making_charge: 1500,
        design_complexity: 'medium',
        stock: 5,
        hsn_code: '7113',
        gold_rate: 59500,
        wastage: 0.5
      },
      {
        barcode: 'GOLD002',
        name: '24K Gold Ring',
        category: 'gold',
        weight: 5.2,
        purity: '24K',
        making_charge: 800,
        design_complexity: 'simple',
        stock: 10,
        hsn_code: '7113',
        gold_rate: 65000,
        wastage: 0.3
      },
      {
        barcode: 'DIAMOND001',
        name: 'Diamond Ring',
        category: 'diamond',
        weight: 2.1,
        purity: '18K',
        making_charge: 2500,
        design_complexity: 'complex',
        stock: 3,
        hsn_code: '7102',
        gold_rate: 48750,
        wastage: 0.2
      }
    ];

    for (const product of sampleProducts) {
      await Product.create(product);
    }
    logger.info('Sample products created');

    // Create sample customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        phone: '+919876543211',
        email: 'john@example.com',
        aadhaar: '123456789012',
        total_purchases: 0,
        preferences: { category: 'gold', style: 'traditional' }
      },
      {
        name: 'Jane Smith',
        phone: '+919876543212',
        email: 'jane@example.com',
        aadhaar: '123456789013',
        total_purchases: 0,
        preferences: { category: 'diamond', style: 'modern' }
      }
    ];

    for (const customer of sampleCustomers) {
      await Customer.create(customer);
    }
    logger.info('Sample customers created');

    logger.info('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 