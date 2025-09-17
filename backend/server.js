require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { sequelize, testPostgresConnection } = require('./config/database');
const logger = require('./utils/logger');
const { User } = require('./models');
const path = require('path');

// Import your route files
const auditLogsRoutes = require('./routes/auditLogs');
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const goldRateRoutes = require('./routes/goldRate');
const hallmarkingRoutes = require('./routes/hallmarking');
const inventoryRoutes = require('./routes/inventory');
const loyaltyRoutes = require('./routes/loyalty');
const productRoutes = require('./routes/products');
const reportingRoutes = require('./routes/reporting');
const transactionsRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const importsRoutes = require('./routes/imports');
const invoiceRoutes = require('./routes/invoices');
const pushRoutes = require('./routes/push');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://jewellery-mgmt.vercel.app', process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/push', pushRoutes);
app.use('/api/gold-rates', goldRateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reports', reportingRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/hallmarking', hallmarkingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/expenses', require('./routes/expense'));
app.use('/api/profit-loss', require('./routes/profitLoss'));
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-template', require('./routes/invoiceTemplate'));
app.use('/api/subscription', require('./routes/subscription'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Comment out local file serving - not suitable for Vercel
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 Not Found Handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    logger.error(`${err.message}\n${err.stack}`);
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Database initialization
const initializeDatabase = async () => {
    try {
        await testPostgresConnection();
        logger.info('✅ Database connected successfully.');
        // Note: In a serverless environment, you might not want to run sync on every invocation.
        // Consider running migrations as a separate build step.
        await sequelize.sync({ alter: true }); 
        logger.info('✅ Database synchronized successfully.');
    } catch (error) {
        logger.error('❌ Database setup failed:', error);
        // Do not exit the process in a serverless environment
    }
};

// Initialize the database when the server starts
initializeDatabase();

module.exports = app;
