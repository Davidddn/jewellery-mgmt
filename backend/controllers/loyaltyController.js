const { Loyalty, Customer, Transaction } = require('../models');

// GET loyalty points for a specific customer
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Use Sequelize's .sum() helper to get total points
    const totalPoints = await Loyalty.sum('points', {
        where: { customer_id, redeemed: false }
    });
    
    res.json({ success: true, points: totalPoints || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST to redeem points for a customer
exports.redeemPoints = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { points_to_redeem } = req.body;
    
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const availablePoints = await Loyalty.sum('points', {
        where: { customer_id, redeemed: false }
    });

    if (!availablePoints || availablePoints < points_to_redeem) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }
    
    // Create a redemption record (better than updating all)
    const redemption = await Loyalty.create({
        customer_id,
        points: -points_to_redeem, // Use negative points for redemption
        redeemed: true // Mark as redeemed
    });
    
    res.json({
      success: true,
      message: 'Points redeemed successfully',
      redeemedPoints: points_to_redeem,
      remainingPoints: availablePoints - points_to_redeem
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST to manually add loyalty points
exports.addLoyaltyPoints = async (req, res) => {
    try {
        const { customer_id, points, transaction_id } = req.body;

        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const loyalty = await Loyalty.create({
            customer_id,
            points,
            transaction_id,
            redeemed: false
        });

        res.status(201).json({ success: true, message: 'Loyalty points added', loyalty });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET loyalty history for a customer
exports.getLoyaltyHistory = async (req, res) => {
    try {
        const { customer_id } = req.params;
        const history = await Loyalty.findAll({
            where: { customer_id },
            include: [{ model: Transaction, attributes: ['id', 'total_amount', 'createdAt'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};