#!/usr/bin/env node

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { getDatabaseType } = require('../config/database');

console.log('🌱 Jewellery Management System - Database Seeding');
console.log('================================================');

const seedDatabase = async () => {
  try {
    const dbType = getDatabaseType();
    console.log(`📊 Database Type: ${dbType.toUpperCase()}`);
    
    console.log('🔄 Seeding database with sample data...');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.createUser({
      username: 'admin',
      email: 'admin@jewellery.com',
      password: 'admin123',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      phone: '+1234567890'
    });
    console.log('✅ Admin user created');
    
    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customers = await Promise.all([
      Customer.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567891',
        address: '123 Main St, City, State 12345',
        date_of_birth: '1990-01-15',
        gender: 'male'
      }),
      Customer.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567892',
        address: '456 Oak Ave, City, State 12345',
        date_of_birth: '1985-05-20',
        gender: 'female'
      }),
      Customer.create({
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1234567893',
        address: '789 Pine Rd, City, State 12345',
        date_of_birth: '1992-08-10',
        gender: 'male'
      })
    ]);
    console.log('✅ Sample customers created');
    
    // Create sample products
    console.log('💍 Creating sample products...');
    const products = await Promise.all([
      Product.create({
        name: '22K Gold Ring',
        description: 'Beautiful 22K gold ring with traditional design',
        category: 'rings',
        subcategory: 'gold',
        sku: 'GR001',
        barcode: '1234567890123',
        weight: 5.5,
        purity: '22K',
        metal_type: 'gold',
        cost_price: 25000,
        selling_price: 30000,
        stock_quantity: 10,
        supplier: 'Gold Supplier Co.'
      }),
      Product.create({
        name: 'Diamond Necklace',
        description: 'Elegant diamond necklace with 18K gold chain',
        category: 'necklaces',
        subcategory: 'diamond',
        sku: 'DN001',
        barcode: '1234567890124',
        weight: 8.2,
        purity: '18K',
        metal_type: 'gold',
        stone_type: 'diamond',
        stone_weight: 1.5,
        cost_price: 150000,
        selling_price: 180000,
        stock_quantity: 5,
        supplier: 'Diamond World'
      }),
      Product.create({
        name: 'Silver Bracelet',
        description: 'Sterling silver bracelet with gemstone accents',
        category: 'bracelets',
        subcategory: 'silver',
        sku: 'SB001',
        barcode: '1234567890125',
        weight: 12.0,
        purity: '925',
        metal_type: 'silver',
        stone_type: 'gemstone',
        cost_price: 8000,
        selling_price: 12000,
        stock_quantity: 15,
        supplier: 'Silver Crafts'
      })
    ]);
    console.log('✅ Sample products created');
    
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Sample data created:');
    console.log(`   👤 Users: 1 (admin)`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   💍 Products: ${products.length}`);
    console.log('');
    console.log('🔑 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

// Run seeding
seedDatabase(); 