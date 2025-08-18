const GoldRate = require('../models/GoldRate');

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
    const latestRate = await GoldRate.findAll({
      order: [['date', 'DESC']],
      limit: 1,
    });
    if (!latestRate || latestRate.length === 0) {
      return res.status(404).json({ success: false, message: 'No gold rates found.' });
    }
    res.status(200).json({ success: true, rate: latestRate[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: error });
  }
};