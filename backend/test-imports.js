console.log('Starting import test...');

try {
  console.log('1. Testing dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  console.log('2. Testing mongoose config...');
  const mongoose = require('./config/mongo');
  console.log('✅ mongoose config loaded');

  console.log('3. Testing logger...');
  const logger = require('./utils/logger');
  console.log('✅ logger loaded');

  console.log('4. Testing models...');
  require('./models/index');
  console.log('✅ models loaded');

  console.log('5. Testing routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ auth routes loaded');

  const productRoutes = require('./routes/products');
  console.log('✅ product routes loaded');

  const customerRoutes = require('./routes/customers');
  console.log('✅ customer routes loaded');

  const transactionRoutes = require('./routes/transactions');
  console.log('✅ transaction routes loaded');

  const inventoryRoutes = require('./routes/inventory');
  console.log('✅ inventory routes loaded');

  const reportingRoutes = require('./routes/reporting');
  console.log('✅ reporting routes loaded');

  const hallmarkingRoutes = require('./routes/hallmarking');
  console.log('✅ hallmarking routes loaded');

  const loyaltyRoutes = require('./routes/loyalty');
  console.log('✅ loyalty routes loaded');

  const auditLogRoutes = require('./routes/auditLogs');
  console.log('✅ audit log routes loaded');

  console.log('✅ All imports successful!');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
} 