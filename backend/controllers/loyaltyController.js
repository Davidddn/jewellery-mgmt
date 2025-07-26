const Loyalty = require('../models/Loyalty');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

exports.getLoyaltyPoints = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    // Check if customer exists
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Get total unredeemed points
    const totalPointsResult = await Loyalty.aggregate([
      { $match: { customer_id, redeemed: false } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    const totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;
    
    // Get loyalty history
    const loyaltyHistory = await Loyalty.find({ customer_id })
      .populate('transaction_id', 'invoice_id total_amount createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      points: totalPoints,
      history: loyaltyHistory
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.redeemPoints = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { points_to_redeem } = req.body;
    
    // Check if customer exists
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Get total available points
    const availablePointsResult = await Loyalty.aggregate([
      { $match: { customer_id, redeemed: false } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    const availablePoints = availablePointsResult.length > 0 ? availablePointsResult[0].total : 0;
    
    if (!availablePoints || availablePoints < points_to_redeem) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points for redemption'
      });
    }
    
    // Mark points as redeemed
    await Loyalty.updateMany(
      { customer_id, redeemed: false },
      { redeemed: true }
    );
    
    // Update customer loyalty points
    customer.loyalty_points = availablePoints - points_to_redeem;
    await customer.save();
    
    res.json({
      success: true,
      message: 'Points redeemed successfully',
      redeemedPoints: points_to_redeem,
      remainingPoints: availablePoints - points_to_redeem
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.addLoyaltyPoints = async (req, res) => {
  try {
    const { customer_id, points, transaction_id } = req.body;
    
    // Check if customer exists
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Add loyalty points
    const loyalty = new Loyalty({
      customer_id,
      points,
      transaction_id,
      redeemed: false
    });
    await loyalty.save();
    
    // Update customer total loyalty points
    customer.loyalty_points += points;
    await customer.save();
    
    res.status(201).json({
      success: true,
      message: 'Loyalty points added successfully',
      loyalty
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLoyaltyHistory = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    const history = await Loyalty.find({ customer_id })
      .populate('transaction_id', 'invoice_id total_amount createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      history
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getTopLoyaltyCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topCustomers = await Customer.find({}, 'name phone loyalty_points total_purchases')
      .sort({ loyalty_points: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      customers: topCustomers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLoyaltyStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const customersWithPoints = await Customer.countDocuments({
      loyalty_points: { $gt: 0 }
    });
    
    const totalPointsResult = await Loyalty.aggregate([
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    const totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;
    
    const redeemedPointsResult = await Loyalty.aggregate([
      { $match: { redeemed: true } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    const redeemedPoints = redeemedPointsResult.length > 0 ? redeemedPointsResult[0].total : 0;
    
    res.json({
      success: true,
      stats: {
        totalCustomers,
        customersWithPoints,
        totalPoints,
        redeemedPoints,
        availablePoints: totalPoints - redeemedPoints
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getLoyaltyTiers = async (req, res) => {
  try {
    const tiers = {
      bronze: { min: 0, max: 1000, discount: 2 },
      silver: { min: 1001, max: 5000, discount: 5 },
      gold: { min: 5001, max: 10000, discount: 8 },
      platinum: { min: 10001, max: null, discount: 10 }
    };
    
    const customerTiers = await Customer.aggregate([
      {
        $project: {
          name: 1,
          loyalty_points: 1,
          tier: {
            $switch: {
              branches: [
                { case: { $lte: ['$loyalty_points', 1000] }, then: 'bronze' },
                { case: { $lte: ['$loyalty_points', 5000] }, then: 'silver' },
                { case: { $lte: ['$loyalty_points', 10000] }, then: 'gold' },
                { case: { $gt: ['$loyalty_points', 10000] }, then: 'platinum' }
              ],
              default: 'bronze'
            }
          }
        }
      },
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          customers: { $push: { name: '$name', points: '$loyalty_points' } }
        }
      }
    ]);
    
    res.json({
      success: true,
      tiers: customerTiers,
      tierBenefits: tiers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 