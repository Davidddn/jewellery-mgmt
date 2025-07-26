const User = require('./User');
const Product = require('./Product');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const TransactionItem = require('./TransactionItem');
const Hallmarking = require('./Hallmarking');
const AuditLog = require('./AuditLog');
const Loyalty = require('./Loyalty');

// SQL database models with foreign key relationships
// Relationships are handled through foreign key constraints

module.exports = {
  User,
  Product,
  Customer,
  Transaction,
  TransactionItem,
  Hallmarking,
  AuditLog,
  Loyalty
}; 