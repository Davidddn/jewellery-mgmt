process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message, err.stack);
    process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { sequelize, testSqliteConnection } = require('./config/database');
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

const initializeDatabase = async (User) => {
    // Test database connection
    const isConnected = await testSqliteConnection();
    if (!isConnected) {
        throw new Error('Database connection failed');
    }
    
    logger.info('✅ Database connected successfully.');
    
    // Sync database - create tables if they don't exist
    await sequelize.sync({ alter: false }); // Use { force: true } to reset tables
    logger.info('✅ Database synchronized successfully.');
    
    // Import models after sync
    // const { User } = require('./models');
    
    // Create default users if they don't exist
    const usersToCreate = [
        { username: 'admin', email: 'admin@example.com', password: 'password', firstName: 'Admin', lastName: 'User', role: 'admin' },
        { username: 'manager', email: 'manager@example.com', password: 'password', firstName: 'Manager', lastName: 'User', role: 'manager' },
        { username: 'sales', email: 'sales@example.com', password: 'password', firstName: 'Sales', lastName: 'User', role: 'sales' }
    ];

    // Use Promise.all for concurrent checks and creations
    await Promise.all(usersToCreate.map(async (userData) => {
        const existingUser = await User.findOne({ where: { username: userData.username } });
        if (!existingUser) {
            await User.create({ ...userData, is_active: true });
            logger.info(`✅ Default ${userData.role} user created with default credentials. Please change this password in a production environment.`);
        }
    }));
};

const startServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 5000;

    // CORS configuration - Use your existing ALLOWED_ORIGINS from .env
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cache-Control',
        'Pragma',
        'Expires'
      ]
    }));

    // Middleware
    app.use(helmet({
        crossOriginEmbedderPolicy: false, // Allow CORS
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));

    // Serve static files from the 'uploads' directory
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'OK', message: 'Server is running' });
    });

    // API Routes
    app.use('/api/gold-rates', require('./routes/goldRate'));
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/reports', reportingRoutes);
    app.use('/api/customers', customersRoutes);
    app.use('/api/hallmarking', hallmarkingRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/loyalty', loyaltyRoutes);
    app.use('/api/transactions', transactionsRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/imports', importsRoutes);
    app.use('/api/invoices', invoiceRoutes);

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

    // Database connection and initialization
    try {
        await initializeDatabase(User);
    } catch (error) {
        logger.error('❌ Database setup failed:', error);
        console.error('❌ Database setup failed:', error.message);
        process.exit(1); // Exit if database setup fails
    }

    // Start server
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API available at http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        
        // Close database connections
        try {
            const { closeConnections } = require('./config/database');
            await closeConnections();
            console.log('Database connections closed successfully');
        } catch (error) {
            console.error('Error closing database connections:', error);
        }
        
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('SIGINT received, shutting down gracefully');
        
        // Close database connections
        try {
            const { closeConnections } = require('./config/database');
            await closeConnections();
            console.log('Database connections closed successfully');
        } catch (error) {
            console.error('Error closing database connections:', error);
        }
        
        process.exit(0);
    });
};

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});