#!/usr/bin/env node

const { initializeDatabase } = require('../config/init-database');
// const { getDatabaseType } = require('../config/database'); // REMOVED: Not needed with Sequelize
const { sequelize } = require('../config/database'); // Import sequelize to get dialect
const fs = require('fs');
const path = require('path');

console.log('🔄 Jewellery Management System - Database Setup');
console.log('==============================================');

const setupDatabase = async () => {
  try {
    // Get database type from Sequelize instance
    const dbType = sequelize.options.dialect;
    console.log(`📊 Database Type: ${dbType.toUpperCase()}`);
    
    // Create data directory for SQLite if needed
    if (dbType === 'sqlite') {
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Created data directory for SQLite');
      }
    }
    
    // Initialize database
    console.log('🔄 Initializing database (synchronizing models)...');
    const success = await initializeDatabase(); // This calls sequelize.sync()
    
    if (success) {
      console.log('✅ Database setup completed successfully!');
      console.log('');
      console.log('🎉 Your jewellery management system is ready to use!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Start the server: npm run dev');
      console.log('   2. Access the application at: http://localhost:5000');
      // Removed step 3 as seeding now includes admin creation
      console.log('');
    } else {
      console.error('❌ Database setup failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  } finally {
    // Close the Sequelize connection after setup is done
    await sequelize.close();
    console.log('Database connection closed after setup.');
  }
};

// Run setup
setupDatabase();
