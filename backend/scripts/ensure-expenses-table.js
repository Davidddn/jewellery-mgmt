// Script to ensure the 'expenses' table exists using Sequelize sync
const { sequelize, Expense } = require('../models');

async function ensureExpensesTable() {
  try {
    await sequelize.authenticate();
    await Expense.sync({ alter: true });
    console.log('✅ Expenses table is present or created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to ensure expenses table:', err);
    process.exit(1);
  }
}

ensureExpensesTable();