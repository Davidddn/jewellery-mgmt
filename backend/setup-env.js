const fs = require('fs');
const path = require('path');

const developmentEnv = `# ========================================
# JEWELLERY MANAGEMENT SYSTEM - BACKEND
# DEVELOPMENT ENVIRONMENT
# ========================================

# Server Configuration
NODE_ENV=development
PORT=5000

# ========================================
# DATABASE CONFIGURATION
# ========================================

# Choose database type: 'postgres' or 'sqlite'
DATABASE_TYPE=sqlite

# PostgreSQL Configuration (for production)
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DB=jewellery_mgmt
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=your-production-password

# SQLite Configuration (for development)
SQLITE_DB_PATH=./data/jewellery_mgmt.db

# ========================================
# AUTHENTICATION & SECURITY
# ========================================

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# EXTERNAL SERVICES
# ========================================

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Gold Rate API
GOLD_RATE_API_URL=https://api.metals.live/v1/spot/gold
GOLD_RATE_API_KEY=your-gold-rate-api-key

# ========================================
# FILE UPLOAD & STORAGE
# ========================================

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# ========================================
# LOGGING
# ========================================

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# ========================================
# CORS
# ========================================

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:4173
`;

const productionEnv = `# ========================================
# JEWELLERY MANAGEMENT SYSTEM - BACKEND
# PRODUCTION ENVIRONMENT
# ========================================

# Server Configuration
NODE_ENV=production
PORT=5000

# ========================================
# DATABASE CONFIGURATION
# ========================================

# Choose database type: 'postgres' or 'sqlite'
DATABASE_TYPE=postgres

# PostgreSQL Configuration (for production)
POSTGRES_HOST=your-production-host
POSTGRES_PORT=5432
POSTGRES_DB=jewellery_mgmt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-production-password

# SQLite Configuration (not used in production)
# SQLITE_DB_PATH=./data/jewellery_mgmt.db

# ========================================
# AUTHENTICATION & SECURITY
# ========================================

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key-for-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# EXTERNAL SERVICES
# ========================================

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Gold Rate API
GOLD_RATE_API_URL=https://api.metals.live/v1/spot/gold
GOLD_RATE_API_KEY=your-gold-rate-api-key

# ========================================
# FILE UPLOAD & STORAGE
# ========================================

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# ========================================
# LOGGING
# ========================================

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# ========================================
# CORS
# ========================================

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
`;

// Create .env file for development
fs.writeFileSync(path.join(__dirname, '.env'), developmentEnv);
console.log('✅ Created .env file for development (SQLite)');

// Create .env.production file for production
fs.writeFileSync(path.join(__dirname, '.env.production'), productionEnv);
console.log('✅ Created .env.production file for production (PostgreSQL)');

// Create data directory for SQLite
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('✅ Created data directory for SQLite');
}

console.log('\n📋 Environment Setup Complete!');
console.log('\n🚀 Available commands:');
console.log('  npm run dev          - Development with SQLite (default)');
console.log('  npm run dev:sqlite   - Development with SQLite');
console.log('  npm run dev:postgres - Development with PostgreSQL');
console.log('  npm run prod         - Production with PostgreSQL');
console.log('  npm run prod:postgres - Production with PostgreSQL');
console.log('\n⚠️  Remember to:');
console.log('  1. Update PostgreSQL credentials in .env.production');
console.log('  2. Change JWT_SECRET in both files');
console.log('  3. Update ALLOWED_ORIGINS for your domain');
console.log('  4. Never commit .env files to version control'); 