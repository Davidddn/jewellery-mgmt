const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.resolve(__dirname, '..', process.env.SQLITE_DB_PATH || './data/jewellery_mgmt.db');

console.log('Database path being used:', dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true
  }
});

/**
 * Tests the SQLite database connection.
 * @returns {Promise<boolean>} True if connection is successful, false otherwise.
 */
const testSqliteConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Unable to connect to SQLite database:', error);
    return false;
  }
};

/**
 * Synchronizes all defined models with the database.
 * This will create tables if they don't exist, and alter them if they do (e.g., add new columns).
 */
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');
  } catch (error) {
    logger.error('Error synchronizing database:', error);
  }
};

/**
 * Closes all database connections.
 * This is important for graceful shutdown.
 */
const closeConnections = async () => {
  try {
    await sequelize.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

module.exports = {
  sequelize,
  testSqliteConnection,
  syncDatabase,
  closeConnections
};
