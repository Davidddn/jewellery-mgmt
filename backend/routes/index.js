const express = require('express');
const router = express.Router();

// Import all your individual route files
const authRoutes = require('./auth');
const productRoutes = require('./products');
const customerRoutes = require('./customers');
const transactionRoutes = require('./transactions');
const reportingRoutes = require('./reporting');
const userRoutes = require('./users');
const goldRateRoutes = require('./goldRate');
const hallmarkingRoutes = require('./hallmarking');
const loyaltyRoutes = require('./loyalty');
const auditLogRoutes = require('./auditLogs');
const inventoryRoutes = require('./inventory');

// Mount each route module on its respective path
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/reports', reportingRoutes);
router.use('/users', userRoutes);
router.use('/gold-rates', goldRateRoutes);
router.use('/hallmarking', hallmarkingRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/inventory', inventoryRoutes);

module.exports = router;
