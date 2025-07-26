const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize } = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Loyalty = require('../models/Loyalty');
const Hallmarking = require('../models/Hallmarking');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

class DatabaseSetup {
  constructor() {
    this.sequelize = sequelize;
  }

  async initializeDatabase() {
    try {
      logger.info('Starting database initialization...');
      
      // Test database connection
      await this.sequelize.authenticate();
      logger.info('Database connection established successfully.');
      
      // Sync all models
      await this.sequelize.sync({ alter: true });
      logger.info('Database models synchronized successfully.');
      
      return true;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async seedDatabase() {
    try {
      logger.info('Starting database seeding...');
      
      // Check if data already exists
      const userCount = await User.count();
      if (userCount > 0) {
        logger.info('Database already contains data. Skipping seeding.');
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@jewellery.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+919876543210',
        isActive: true
      });
      logger.info('Admin user created successfully.');

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
          wastage: 0.5,
          description: 'Traditional gold chain with intricate design'
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
          wastage: 0.3,
          description: 'Classic gold ring with simple design'
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
          wastage: 0.2,
          description: 'Elegant diamond ring with premium stones'
        },
        {
          barcode: 'SILVER001',
          name: 'Silver Necklace',
          category: 'silver',
          weight: 15.0,
          purity: '925',
          making_charge: 500,
          design_complexity: 'medium',
          stock: 8,
          hsn_code: '7113',
          gold_rate: 0,
          wastage: 0.1,
          description: 'Beautiful silver necklace with traditional design'
        }
      ];

      for (const product of sampleProducts) {
        await Product.create(product);
      }
      logger.info('Sample products created successfully.');

      // Create sample customers
      const sampleCustomers = [
        {
          name: 'John Doe',
          phone: '+919876543211',
          email: 'john@example.com',
          aadhaar: '123456789012',
          total_purchases: 0,
          preferences: JSON.stringify({ category: 'gold', style: 'traditional' }),
          address: '123 Main Street, City, State 12345'
        },
        {
          name: 'Jane Smith',
          phone: '+919876543212',
          email: 'jane@example.com',
          aadhaar: '123456789013',
          total_purchases: 0,
          preferences: JSON.stringify({ category: 'diamond', style: 'modern' }),
          address: '456 Oak Avenue, City, State 12345'
        },
        {
          name: 'Mike Johnson',
          phone: '+919876543213',
          email: 'mike@example.com',
          aadhaar: '123456789014',
          total_purchases: 0,
          preferences: JSON.stringify({ category: 'silver', style: 'contemporary' }),
          address: '789 Pine Road, City, State 12345'
        }
      ];

      for (const customer of sampleCustomers) {
        await Customer.create(customer);
      }
      logger.info('Sample customers created successfully.');

      // Create sample transactions
      const sampleTransactions = [
        {
          customer_id: 1,
          product_id: 1,
          quantity: 1,
          unit_price: 625000,
          total_amount: 625000,
          transaction_type: 'sale',
          payment_method: 'cash',
          status: 'completed',
          notes: 'First purchase'
        },
        {
          customer_id: 2,
          product_id: 3,
          quantity: 1,
          unit_price: 51250,
          total_amount: 51250,
          transaction_type: 'sale',
          payment_method: 'card',
          status: 'completed',
          notes: 'Diamond ring purchase'
        }
      ];

      for (const transaction of sampleTransactions) {
        await Transaction.create(transaction);
      }
      logger.info('Sample transactions created successfully.');

      // Create sample loyalty records
      const sampleLoyalty = [
        {
          customer_id: 1,
          points_earned: 6250,
          points_redeemed: 0,
          current_balance: 6250,
          tier: 'silver'
        },
        {
          customer_id: 2,
          points_earned: 5125,
          points_redeemed: 0,
          current_balance: 5125,
          tier: 'bronze'
        }
      ];

      for (const loyalty of sampleLoyalty) {
        await Loyalty.create(loyalty);
      }
      logger.info('Sample loyalty records created successfully.');

      // Create sample hallmarking records
      const sampleHallmarking = [
        {
          product_id: 1,
          hallmark_number: 'HML001',
          purity_verified: '22K',
          weight_verified: 10.5,
          certification_date: new Date(),
          status: 'certified'
        },
        {
          product_id: 2,
          hallmark_number: 'HML002',
          purity_verified: '24K',
          weight_verified: 5.2,
          certification_date: new Date(),
          status: 'certified'
        }
      ];

      for (const hallmarking of sampleHallmarking) {
        await Hallmarking.create(hallmarking);
      }
      logger.info('Sample hallmarking records created successfully.');

      logger.info('Database seeding completed successfully!');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async resetDatabase() {
    try {
      logger.info('Starting database reset...');
      
      // Drop all tables and recreate
      await this.sequelize.sync({ force: true });
      logger.info('Database reset completed successfully.');
      
      // Re-seed the database
      await this.seedDatabase();
      
    } catch (error) {
      logger.error('Database reset failed:', error);
      throw error;
    }
  }

  async backupDatabase() {
    try {
      logger.info('Starting database backup...');
      
      // Get all data from all tables
      const backup = {
        users: await User.findAll({ raw: true }),
        products: await Product.findAll({ raw: true }),
        customers: await Customer.findAll({ raw: true }),
        transactions: await Transaction.findAll({ raw: true }),
        loyalty: await Loyalty.findAll({ raw: true }),
        hallmarking: await Hallmarking.findAll({ raw: true }),
        auditLogs: await AuditLog.findAll({ raw: true }),
        timestamp: new Date().toISOString()
      };
      
      // Save backup to file
      const fs = require('fs');
      const path = require('path');
      const backupPath = path.join(__dirname, '../backups');
      
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      
      const backupFile = path.join(backupPath, `backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      
      logger.info(`Database backup saved to: ${backupFile}`);
      return backupFile;
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  async getDatabaseStats() {
    try {
      const stats = {
        users: await User.count(),
        products: await Product.count(),
        customers: await Customer.count(),
        transactions: await Transaction.count(),
        loyalty: await Loyalty.count(),
        hallmarking: await Hallmarking.count(),
        auditLogs: await AuditLog.count()
      };
      
      logger.info('Database statistics:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get database statistics:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const setup = new DatabaseSetup();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'init':
        await setup.initializeDatabase();
        break;
      case 'seed':
        await setup.seedDatabase();
        break;
      case 'reset':
        await setup.resetDatabase();
        break;
      case 'backup':
        await setup.backupDatabase();
        break;
      case 'stats':
        await setup.getDatabaseStats();
        break;
      case 'setup':
        await setup.initializeDatabase();
        await setup.seedDatabase();
        break;
      default:
        console.log(`
Database Setup Script

Usage: node database-setup.js [command]

Commands:
  init    - Initialize database (create tables)
  seed    - Seed database with sample data
  reset   - Reset database (drop and recreate all tables)
  backup  - Create a backup of all data
  stats   - Show database statistics
  setup   - Initialize and seed database (recommended for first time)

Examples:
  node database-setup.js setup
  node database-setup.js init
  node database-setup.js seed
        `);
    }
  } catch (error) {
    logger.error('Database operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseSetup; 