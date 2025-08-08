const { Op } = require("sequelize");
const { Product } = require('../models');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    // If a file was uploaded, add its path to the data
    if (req.file) {
      // The path will depend on your server setup, e.g., '/uploads/filename.jpg'
      productData.image_url = `/uploads/${req.file.filename}`;
    }
    const product = await Product.create(productData);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { category, purity, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (purity) query.purity = purity;
    if (search) {
      query[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const products = await Product.findAll({ where: query });
    res.json({
      success: true,
      products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ where: { barcode } });

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

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

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

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedRows] = await Product.update(req.body, { where: { id } });
    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = await Product.findByPk(id);
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRows = await Product.destroy({ where: { id } });
    if (deletedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    // Standardized to 'stock_quantity'
    const { stock_quantity } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.stock_quantity = stock_quantity;
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

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    // Standardized to 'stock_quantity'
    const products = await Product.findAll({ where: { stock_quantity: { [Op.lte]: threshold } } });
    
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