const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Temporary fix: Set NODE_ENV if not defined
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('NODE_ENV set to development');
}

console.log('🚀 Starting server debug...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_TYPE:', process.env.DATABASE_TYPE);

// Basic middleware
console.log('✅ Setting up basic middleware...');

// Import database configuration
const { 
  testSqliteConnection,
  closeConnections 
} = require('./config/database');
const { initializeDatabase } = require('./config/init-database');
const logger = require('./utils/logger');

// Import models to establish associations
require('./models/index');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const inventoryRoutes = require('./routes/inventory');
const reportingRoutes = require('./routes/reporting');
const hallmarkingRoutes = require('./routes/hallmarking');
const loyaltyRoutes = require('./routes/loyalty');
const auditLogRoutes = require('./routes/auditLogs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

//API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/hallmarking', hallmarkingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection and initialization
const initializeServer = async () => {
  console.log('🔗 Attempting database connection...');
  
  try {
    // Test SQLite connection
    console.log(`🔄 Connecting to SQLITE database...`);
    const connectionSuccess = await testSqliteConnection();
    
    if (connectionSuccess) {
      console.log('✅ SQLite connected successfully');
      
      // Initialize database schema
      const initSuccess = await initializeDatabase();
      if (initSuccess) {
        console.log('✅ Database initialized successfully');
        logger.info('Database connection and initialization successful.');
        
        // Start server after database connects
        const server = app.listen(PORT, () => {
          console.log(`✅ Server running on port ${PORT}`);
          console.log(`🌐 Test URL: http://localhost:${PORT}/test`);
          logger.info(`Server running on port ${PORT}`);
          logger.info(`Environment: ${process.env.NODE_ENV}`);
          logger.info(`Database: SQLITE`);
        });
        
        server.on('error', (err) => {
          console.error('❌ Server failed to start:', err);
          if (err.code === 'EADDRINUSE') {
            console.log(`❌ Port ${PORT} is already in use. Try a different port or kill existing processes.`);
          }
        });
        
      } else {
        console.error('❌ Database initialization failed');
        process.exit(1);
      }
    } else {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database setup error:', error);
    logger.error('Database setup error:', error);
    process.exit(1);
  }
};

// Initialize server
initializeServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await closeConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await closeConnections();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});