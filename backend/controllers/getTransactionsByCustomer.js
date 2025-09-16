// @desc    Get all transactions for a customer
// @route   GET /api/transactions/customer/:customerId
// @access  Admin, Manager, Sales
const { Transaction, Customer, TransactionItem, Product } = require('../models');

const getTransactionsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const transactions = await Transaction.findAll({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']],
      include: [
        { model: TransactionItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = getTransactionsByCustomer;
