const path = require('path');

const config = {
  development: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    sqlite: {
      storage: process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'jewellery_mgmt.db')
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'jewellery_mgmt',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionString: process.env.DATABASE_URL
    }
  },
  production: {
    type: 'postgres',
    postgres: {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }, // Required for Neon
      connectionString: process.env.DATABASE_URL,
      pool: {
        min: 0,
        max: 10,
        acquire: 30000,
        idle: 10000
      }
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'production'];