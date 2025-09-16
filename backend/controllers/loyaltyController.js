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

    // Check if customer has enough points
    if (customer.loyalty_points < points_to_redeem) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }
    
    // Create a redemption record (negative points)
    const redemption = await Loyalty.create({
        customer_id,
        points: -points_to_redeem, // Use negative points for redemption
        redeemed: true // Mark as redeemed
    });

    // Update customer's total loyalty points
    await customer.decrement('loyalty_points', { by: points_to_redeem });

    // Fetch updated customer data
    await customer.reload();
    
    res.json({
      success: true,
      message: 'Points redeemed successfully',
      redeemedPoints: points_to_redeem,
      remainingPoints: customer.loyalty_points,
      customer: {
        id: customer.id,
        name: customer.name,
        loyalty_points: customer.loyalty_points
      }
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

        // Create loyalty record
        const loyalty = await Loyalty.create({
            customer_id,
            points,
            transaction_id,
            redeemed: false
        });

        // Update customer's total loyalty points
        await customer.increment('loyalty_points', { by: points });

        // Fetch updated customer data
        await customer.reload();

        res.status(201).json({ 
            success: true, 
            message: 'Loyalty points added successfully', 
            loyalty,
            customer: {
                id: customer.id,
                name: customer.name,
                loyalty_points: customer.loyalty_points
            }
        });
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