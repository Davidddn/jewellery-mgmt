const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Loyalty = require('../models/Loyalty');

exports.createTransaction = async (req, res) => {
  try {
    const { customer_id, product_id, quantity, payment_mode, emi_months } = req.body;
    
    // Validate product exists and has stock
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Calculate GST (3% on gold)
    const gst_amount = product.category === 'gold'
      ? (product.weight * product.gold_rate * 0.03) * quantity
      : 0;

    // Calculate total amount
    const baseAmount = (product.weight * product.gold_rate) + product.making_charge;
    const total_amount = (baseAmount + gst_amount) * quantity;

    const transaction = new Transaction({
      customer_id,
      product_id,
      quantity,
      total_amount,
      gst_amount,
      payment_mode,
      emi_months,
      gold_rate_at_sale: product.gold_rate
    });

    await transaction.save();

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Update customer total purchases
    const customer = await Customer.findById(customer_id);
    if (customer) {
      customer.total_purchases += total_amount;
      await customer.save();
    }

    // Add loyalty points (1% of transaction value)
    const loyalty = new Loyalty({
      customer_id,
      points: total_amount * 0.01,
      transaction_id: transaction.invoice_id
    });
    await loyalty.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { customer_id, status, payment_mode, start_date, end_date } = req.query;
    let filter = {};
    
    if (customer_id) filter.customer_id = customer_id;
    if (status) filter.status = status;
    if (payment_mode) filter.payment_mode = payment_mode;
    
    if (start_date && end_date) {
      filter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transactions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByIdAndDelete(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { return_reason } = req.body;
    
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Update transaction status
    transaction.status = 'returned';
    transaction.return_reason = return_reason;
    await transaction.save();
    
    // Restore product stock
    const product = await Product.findById(transaction.product_id);
    if (product) {
      product.stock += transaction.quantity;
      await product.save();
    }
    
    // Deduct loyalty points
    const loyalty = await Loyalty.findOne({ transaction_id: transaction.invoice_id });
    if (loyalty) {
      loyalty.points = Math.max(0, loyalty.points - (transaction.total_amount * 0.01));
      await loyalty.save();
    }
    
    res.json({
      success: true,
      message: 'Return processed successfully',
      transaction
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getTransactionStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = {};
    
    if (start_date && end_date) {
      dateFilter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    const stats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: '$total_amount' },
          avgTransactionValue: { $avg: '$total_amount' }
        }
      }
    ]);
    
    const paymentModeStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$payment_mode',
          count: { $sum: 1 },
          total: { $sum: '$total_amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalTransactions: 0,
        totalRevenue: 0,
        avgTransactionValue: 0
      },
      paymentModeStats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 