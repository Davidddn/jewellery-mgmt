require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

// This function will contain the main application logic
const startServer = async () => {
  try {
    // Dynamically import routes inside the async function
    const apiRoutes = require('./routes/index');

    const app = express();
    const PORT = process.env.PORT || 5000;

    // --- Middleware Setup ---
    app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(',') }));
    app.use(helmet());
    app.use(express.json());
    app.use(morgan('dev'));

    // --- API Routes ---
    app.use('/api', apiRoutes);

    // --- 404 Not Found Handler ---
    app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      res.status(404);
      next(error);
    });

    // --- Global Error Handler ---
    app.use((err, req, res, next) => {
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      logger.error(`${err.message}\n${err.stack}`);
      res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    });

    // --- Database and Server Initialization ---
    await sequelize.authenticate();
    logger.info('Database connected successfully.');

    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });

  } catch (err) {
    // This will catch any error during the startup process
    console.error('🔴 A FATAL ERROR occurred during server startup:');
    console.error(err);
    process.exit(1);
  }
};

startServer();
