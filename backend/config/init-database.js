const { sequelize, User, GoldRate } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * Initializes the database by synchronizing models.
 * This will create tables if they don't exist.
 * In a production environment, consider using migrations instead of `sync({ force: true })`.
 * @returns {Promise<boolean>} True if database initialization is successful, false otherwise.
 */
const initializeDatabase = async () => {
  try {
    console.log('🔄 Connecting to SQLITE database...');
    // Test database connection
    await sequelize.authenticate();
    logger.info('Connection to SQLite has been established successfully');
    console.log('✅ SQLite connected successfully');

    // Force sync in development only
    const syncOptions = {
      force: process.env.NODE_ENV === 'development',
      alter: true
    };

    // Sync models with { alter: true }
    await sequelize.sync(syncOptions);
    logger.info('Database synchronized successfully');

    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        is_active: true
      });
      logger.info('Default admin user created');
    }

    // Initialize gold rates if they don't exist
    const goldRatesExist = await GoldRate.findOne();
    if (!goldRatesExist) {
      await GoldRate.bulkCreate([
        { purity: '24K', rate: 0.00 },
        { purity: '22K', rate: 0.00 },
        { purity: '18K', rate: 0.00 }
      ]);
      logger.info('Default gold rates initialized');
    }

    return true;
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = initializeDatabase;
