// --- PostgreSQL configuration (commented out) ---
/*
const { Pool } = require('pg');
*/
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database configuration
const config = {
  /*
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'jewellery_mgmt',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  */
  sqlite: {
    filename: process.env.SQLITE_DB_PATH || path.join(__dirname, '../data/jewellery_mgmt.db'),
    verbose: process.env.NODE_ENV === 'development'
  }
};

// --- PostgreSQL Pool (commented out) ---
/*
let postgresPool = null;
const getPostgresPool = () => {
  if (!postgresPool) {
    postgresPool = new Pool(config.postgres);
    postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return postgresPool;
};
*/

// SQLite Database
let sqliteDb = null;

const getSqliteDb = () => {
  if (!sqliteDb) {
    sqliteDb = new sqlite3.Database(config.sqlite.filename, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        // Enable foreign keys
        sqliteDb.run('PRAGMA foreign_keys = ON');
      }
    });
  }
  return sqliteDb;
};

// Database type selection (force sqlite)
const getDatabaseType = () => {
  return 'sqlite'; // Only use sqlite
};

// --- PostgreSQL test function (commented out) ---
/*
const testPostgresConnection = async () => {
  const pool = getPostgresPool();
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connection successful');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
};
*/

// SQLite test function
const testSqliteConnection = async () => {
  return new Promise((resolve) => {
    const db = getSqliteDb();
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err.message);
        resolve(false);
      } else {
        console.log('✅ SQLite connection successful');
        resolve(true);
      }
    });
  });
};

// --- Close connections (remove postgres) ---
const closeConnections = async () => {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
};

module.exports = {
  // getPostgresPool, // commented out
  getSqliteDb,
  getDatabaseType,
  // testPostgresConnection, // commented out
  testSqliteConnection,
  closeConnections,
  config
}; 