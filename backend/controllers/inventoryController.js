const { Product, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');

// Barcode/RFID scan
exports.scanItem = async (req, res) => {
  try {
    const { barcode } = req.body;
    const product = await Product.findOne({ where: { barcode } });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stock alerts
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    // Standardized to 'stock_quantity'
    const products = await Product.findAll({
      where: { stock_quantity: { [Op.lte]: threshold } }
    });
    res.json({ success: true, products, threshold });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update stock levels
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    // Standardized to 'stock_quantity'
    const { stock_quantity, operation } = req.body;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    let newStock = product.stock_quantity;
    switch (operation) {
      case 'add': newStock += stock_quantity; break;
      case 'subtract': newStock -= stock_quantity; break;
      case 'set': newStock = stock_quantity; break;
      default: newStock = stock_quantity;
    }
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }
    
    product.stock_quantity = newStock;
    await product.save();
    
    res.json({ success: true, message: 'Stock updated', product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
    try {
        const totalProducts = await Product.count();
        // Standardized to 'stock_quantity'
        const lowStockProducts = await Product.count({ where: { stock_quantity: { [Op.lte]: 5 } } });
        const outOfStockProducts = await Product.count({ where: { stock_quantity: 0 } });
        
        // Summing based on stock_quantity
        const totalValue = await Product.sum('selling_price', { where: { stock_quantity: { [Op.gt]: 0 } } });

        res.json({
            success: true,
            summary: {
                totalProducts,
                lowStockProducts,
                outOfStockProducts,
                totalValue: totalValue || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};