const { Op } = require("sequelize");
const { Product } = require('../models');
const { sequelize } = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    // Removed tags handling as the column is removed from the model

    // If a file was uploaded, add its path to the data
    if (req.files && req.files.image && req.files.image[0]) {
      productData.image_url = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files && req.files.back_image && req.files.back_image[0]) {
      productData.back_image_url = `/uploads/${req.files.back_image[0].filename}`;
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
    const { category, purity, search, minPrice, maxPrice } = req.query; // Removed tags from destructuring
    let query = {};

    if (category) query.category = category;
    if (purity && purity !== '') query.purity = purity;

    if (minPrice && maxPrice) {
      query.selling_price = { [Op.between]: [minPrice, maxPrice] };
    } else if (minPrice) {
      query.selling_price = { [Op.gte]: minPrice };
    } else if (maxPrice) {
      query.selling_price = { [Op.lte]: maxPrice };
    }

    // Removed tags filtering logic

    if (search) {
      const searchTerm = search.toLowerCase();
      query[Op.or] = [
        sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
          [Op.like]: `%${searchTerm}%`
        }),
        sequelize.where(sequelize.fn('lower', sequelize.col('barcode')), {
          [Op.like]: `%${searchTerm}%`
        }),
      ];
    }

    const products = await Product.findAll({ where: query });
    res.json({
      success: true,
      products
    });
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
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

// Get product by SKU
exports.getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const product = await Product.findOne({ where: { sku } });

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
    const productData = req.body; // Get product data from body

    // Removed tags handling as the column is removed from the model

    // Handle image uploads
    if (req.files && req.files.image && req.files.image[0]) {
      productData.image_url = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files && req.files.back_image && req.files.back_image[0]) {
      productData.back_image_url = `/uploads/${req.files.back_image[0].filename}`;
    }

    const [updatedRows] = await Product.update(productData, { where: { id } }); // Use productData
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

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchTerm = q.toString().trim().toLowerCase();
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
            [Op.like]: `%${searchTerm}%`
          }),
          sequelize.where(sequelize.fn('lower', sequelize.col('barcode')), {
            [Op.like]: `%${searchTerm}%`
          }),
          sequelize.where(sequelize.fn('lower', sequelize.col('sku')), {
            [Op.like]: `%${searchTerm}%`
          }),
        ],
      },
      limit: 10,
    });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let createdCount = 0;
      let updatedCount = 0;

      for (const item of results) {
        const { sku, ...productData } = item;

        try {
          const [product, created] = await Product.findOrCreate({
            where: { sku },
            defaults: productData,
          });

          if (created) {
            createdCount++;
          } else {
            await product.update(productData);
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error processing SKU ${sku}:`, error);
        }
      }

      fs.unlinkSync(filePath); // Clean up the uploaded file
      res.status(200).json({ 
        success: true, 
        message: 'CSV processed successfully.',
        created: createdCount,
        updated: updatedCount,
      });
    });
};