const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.resolve(__dirname, '..', process.env.SQLITE_DB_PATH || './data/jewellery_mgmt.db');

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
  closeConnections
};
