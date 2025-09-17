const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config/database');

let db;

if (config.type === 'postgres') {
  // PostgreSQL connection (for production with Neon)
  const poolConfig = config.postgres.connectionString ? 
    { connectionString: config.postgres.connectionString, ssl: config.postgres.ssl } :
    {
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.username,
      password: config.postgres.password,
      ssl: config.postgres.ssl,
      ...config.postgres.pool
    };

  db = new Pool(poolConfig);

  // Test connection
  db.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('PostgreSQL connection error:', err);
    } else {
      console.log('PostgreSQL connected successfully:', result.rows[0]);
    }
  });

} else {
  // SQLite connection (for development)
  db = new sqlite3.Database(config.sqlite.storage, (err) => {
    if (err) {
      console.error('SQLite connection error:', err.message);
    } else {
      console.log('Connected to SQLite database');
    }
  });
}

module.exports = db;