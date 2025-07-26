const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

console.log('Environment Variables Debug (using .env.test):');
console.log('Current directory:', __dirname);
console.log('.env file path:', path.join(__dirname, '.env.test'));
console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
console.log('SQLITE_DB_PATH:', process.env.SQLITE_DB_PATH);

// Test the database type function
const { getDatabaseType } = require('./config/database');
console.log('getDatabaseType():', getDatabaseType()); 