const { GoldRate } = require('../models');

exports.createGoldRate = async (req, res) => {
  try {
    const { rate_22k, rate_18k, rate_24k } = req.body;
    const newRate = await GoldRate.create({ rate_22k, rate_18k, rate_24k });
    res.status(201).json({ success: true, rate: newRate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: error });
  }
};

exports.getLatestGoldRate = async (req, res) => {
  try {
    const latestRate = await GoldRate.findOne({
      order: [['date', 'DESC']],
    });
    if (!latestRate) {
      return res.status(404).json({ success: false, message: 'No gold rates found.' });
    }
  res.status(200).json({ success: true, data: latestRate });
  } catch (error) {
    console.error('Error in getLatestGoldRate:', error);
    res.status(500).json({ success: false, message: error.message, error: error.stack });
  }
};