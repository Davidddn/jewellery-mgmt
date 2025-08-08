#!/usr/bin/env node

// Import Sequelize models directly
const { User, Customer, Product, sequelize } = require('../models'); // Import models and sequelize instance
const logger = require('../utils/logger'); // Assuming you have a logger utility

console.log('🌱 Jewellery Management System - Database Seeding');
console.log('================================================');

const seedDatabase = async () => {
  try {
    // We are using Sequelize, so no need for custom dbType check here
    console.log(`📊 Database Type: ${sequelize.options.dialect.toUpperCase()}`);
    
    console.log('🔄 Seeding database with sample data...');
    
    // Ensure tables are synchronized before seeding
    // In a real application, you might run migrations instead
    await sequelize.sync({ alter: true }); // Ensure tables exist and are up to date
    console.log('✅ Database schema synchronized for seeding.');

    // Create admin user
    console.log('👤 Creating admin user...');
    // Use findOrCreate to prevent errors if admin already exists
    const [adminUser, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@jewellery.com',
        password: 'admin123', // Password will be hashed by User model hook
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890'
      }
    });
    if (created) {
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customerData = [
      { name: 'John Doe', email: 'john@example.com', phone: '+1234567891', address: '123 Main St, City, State 12345', date_of_birth: '1990-01-15', gender: 'male' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567892', address: '456 Oak Ave, City, State 12345', date_of_birth: '1985-05-20', gender: 'female' },
      { name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567893', address: '789 Pine Rd, City, State 12345', date_of_birth: '1992-08-10', gender: 'male' }
    ];
    const customers = await Promise.all(customerData.map(data => Customer.findOrCreate({
      where: { email: data.email }, // Use a unique field for findOrCreate
      defaults: data
    }).then(([customer, created]) => {
      if (created) logger.info(`  Created customer: ${customer.name}`);
      else logger.info(`  Customer already exists: ${customer.name}`);
      return customer;
    })));
    console.log('✅ Sample customers processed');
    
    // Create sample products
    console.log('💍 Creating sample products...');
    const productData = [
      { name: '22K Gold Ring', description: 'Beautiful 22K gold ring with traditional design', category: 'rings', subcategory: 'gold', sku: 'GR001', barcode: '1234567890123', weight: 5.5, purity: '22K', metal_type: 'gold', cost_price: 25000, selling_price: 30000, stock_quantity: 10, supplier: 'Gold Supplier Co.' },
      { name: 'Diamond Necklace', description: 'Elegant diamond necklace with 18K gold chain', category: 'necklaces', subcategory: 'diamond', sku: 'DN001', barcode: '1234567890124', weight: 8.2, purity: '18K', metal_type: 'gold', stone_type: 'diamond', stone_weight: 1.5, cost_price: 150000, selling_price: 180000, stock_quantity: 5, supplier: 'Diamond World' },
      { name: 'Silver Bracelet', description: 'Sterling silver bracelet with gemstone accents', category: 'bracelets', subcategory: 'silver', sku: 'SB001', barcode: '1234567890125', weight: 12.0, purity: '925', metal_type: 'silver', stone_type: 'gemstone', cost_price: 8000, selling_price: 12000, stock_quantity: 15, supplier: 'Silver Crafts' }
    ];
    const products = await Promise.all(productData.map(data => Product.findOrCreate({
      where: { sku: data.sku }, // Use a unique field for findOrCreate
      defaults: data
    }).then(([product, created]) => {
      if (created) logger.info(`  Created product: ${product.name}`);
      else logger.info(`  Product already exists: ${product.name}`);
      return product;
    })));
    console.log('✅ Sample products processed');
    
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Sample data created:');
    console.log(`   👤 Users: ${await User.count()}`); // Count users directly
    console.log(`   👥 Customers: ${await Customer.count()}`); // Count customers directly
    console.log(`   💍 Products: ${await Product.count()}`); // Count products directly
    console.log('');
    console.log('🔑 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    
  } catch (error) {
    logger.error('❌ Seeding error:', error); // Changed from error.message to full error object
    process.exit(1);
  } finally {
    // Close the Sequelize connection after seeding is done
    await sequelize.close();
    console.log('Database connection closed after seeding.');
  }
};

// Run seeding
seedDatabase();
