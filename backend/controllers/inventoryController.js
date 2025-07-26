const Product = require('../models/Product');

// Barcode/RFID scan
exports.scanItem = async (req, res) => {
  try {
    const { barcode } = req.body;
    const product = await Product.findOne({ barcode });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Stock alerts
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const products = await Product.find({
      stock: { $lte: threshold }
    });
    
    res.json({
      success: true,
      products,
      threshold
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Auto-apply making charges based on design complexity
exports.calculateMakingCharge = async (req, res) => {
  try {
    const { design_complexity, weight, purity } = req.body;
    let charge = 0;
    
    // Base charge based on complexity
    switch (design_complexity) {
      case 'simple':
        charge = 500;
        break;
      case 'medium':
        charge = 1000;
        break;
      case 'complex':
        charge = 2000;
        break;
      default:
        charge = 500;
    }
    
    // Additional charge based on weight and purity
    if (weight && purity) {
      const purityMultiplier = purity === '24K' ? 1.2 : purity === '22K' ? 1.0 : 0.8;
      charge += (weight * 100 * purityMultiplier);
    }
    
    res.json({
      success: true,
      making_charge: Math.round(charge),
      breakdown: {
        base_charge: charge,
        design_complexity,
        weight,
        purity
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Update stock levels
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation } = req.body; // operation: 'add', 'subtract', 'set'
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let newStock = product.stock;
    switch (operation) {
      case 'add':
        newStock += stock;
        break;
      case 'subtract':
        newStock -= stock;
        break;
      case 'set':
        newStock = stock;
        break;
      default:
        newStock = stock;
    }
    
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }
    
    product.stock = newStock;
    await product.save();
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      stock: { $lte: 5 }
    });
    const outOfStockProducts = await Product.countDocuments({
      stock: 0
    });
    
    const totalValueResult = await Product.aggregate([
      { $match: { stock: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);
    
    const totalValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;
    
    res.json({
      success: true,
      summary: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Bulk stock update
exports.bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, stock, operation}
    
    const results = [];
    for (const update of updates) {
      const product = await Product.findById(update.id);
      if (product) {
        let newStock = product.stock;
        switch (update.operation) {
          case 'add':
            newStock += update.stock;
            break;
          case 'subtract':
            newStock -= update.stock;
            break;
          case 'set':
            newStock = update.stock;
            break;
          default:
            newStock = update.stock;
        }
        
        if (newStock < 0) {
          results.push({
            id: update.id,
            success: false,
            message: 'Stock cannot be negative'
          });
        } else {
          product.stock = newStock;
          await product.save();
          results.push({
            id: update.id,
            success: true,
            newStock
          });
        }
      } else {
        results.push({
          id: update.id,
          success: false,
          message: 'Product not found'
        });
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Get stock movement history
exports.getStockHistory = async (req, res) => {
  try {
    const { product_id, start_date, end_date } = req.query;
    let filter = {};
    
    if (product_id) filter.product_id = product_id;
    if (start_date && end_date) {
      filter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    
    // Note: This would require a separate StockMovement model
    // For now, we'll return a placeholder
    res.json({
      success: true,
      message: 'Stock history feature requires StockMovement model implementation',
      movements: []
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 