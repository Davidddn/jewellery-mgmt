const { Product } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

// Create product with images
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Handle image uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        productData.image_url = `/uploads/products/${req.files.image[0].filename}`;
      }
      if (req.files.back_image && req.files.back_image[0]) {
        productData.back_image_url = `/uploads/products/${req.files.back_image[0].filename}`;
      }
    }

    const product = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Clean up uploaded files if product creation fails
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product with images
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle image uploads
    const oldImageUrl = product.image_url;
    const oldBackImageUrl = product.back_image_url;
    
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        updateData.image_url = `/uploads/products/${req.files.image[0].filename}`;
        // Delete old image
        if (oldImageUrl) {
          const oldImagePath = path.join(__dirname, '..', oldImageUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      
      if (req.files.back_image && req.files.back_image[0]) {
        updateData.back_image_url = `/uploads/products/${req.files.back_image[0].filename}`;
        // Delete old back image
        if (oldBackImageUrl) {
          const oldBackImagePath = path.join(__dirname, '..', oldBackImageUrl);
          if (fs.existsSync(oldBackImagePath)) {
            fs.unlinkSync(oldBackImagePath);
          }
        }
      }
    }

    await product.update(updateData);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Clean up uploaded files if update fails
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Upload additional images for existing product
const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
    
    // For now, we'll update the main image if it's empty
    if (!product.image_url && imagePaths[0]) {
      await product.update({ image_url: imagePaths[0] });
    }
    
    if (!product.back_image_url && imagePaths[1]) {
      await product.update({ back_image_url: imagePaths[1] });
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      imagePaths
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    
    // Clean up uploaded files if upload fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// Delete specific image
const deleteImage = async (req, res) => {
  try {
    const { id, imageType } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let imageUrl;
    let updateField;
    
    if (imageType === 'main') {
      imageUrl = product.image_url;
      updateField = 'image_url';
    } else if (imageType === 'back') {
      imageUrl = product.back_image_url;
      updateField = 'back_image_url';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type'
      });
    }

    if (imageUrl) {
      // Delete file from filesystem
      const imagePath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      // Update database
      await product.update({ [updateField]: null });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      purity, 
      minPrice, 
      maxPrice,
      tags, // ADD THIS
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
      
      // Only add tags search if the tags column exists
      try {
        whereClause[Op.or].push({ tags: { [Op.like]: `%${search}%` } });
      } catch (error) {
        console.log('Tags column might not exist yet');
      }
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (purity) {
      whereClause.purity = purity;
    }
    
    // ADD THIS TAGS FILTER - with error handling
    if (tags) {
      try {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tagArray.length > 0) {
          const tagConditions = tagArray.map(tag => ({
            tags: { [Op.like]: `%${tag}%` }
          }));
          whereClause[Op.and] = whereClause[Op.and] || [];
          whereClause[Op.and].push({ [Op.or]: tagConditions });
        }
      } catch (error) {
        console.log('Error processing tags filter:', error.message);
      }
    }
    
    if (minPrice || maxPrice) {
      whereClause.selling_price = {};
      if (minPrice) whereClause.selling_price[Op.gte] = minPrice;
      if (maxPrice) whereClause.selling_price[Op.lte] = maxPrice;
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      products: products.rows,
      totalCount: products.count,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
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
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { sku: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
          { category: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 20
    });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

// Get product by barcode
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const product = await Product.findOne({
      where: { barcode }
    });
    
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
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Get product by SKU
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    
    const product = await Product.findOne({
      where: { sku }
    });
    
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
  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images
    if (product.image_url) {
      const imagePath = path.join(__dirname, '..', product.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (product.back_image_url) {
      const backImagePath = path.join(__dirname, '..', product.back_image_url);
      if (fs.existsSync(backImagePath)) {
        fs.unlinkSync(backImagePath);
      }
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Export CSV (placeholder)
const exportCSV = async (req, res) => {
  try {
    const products = await Product.findAll();
    
    // Convert to CSV format
    const csvHeaders = 'ID,Name,SKU,Category,Purity,Weight,Cost Price,Selling Price,Stock Quantity\n';
    const csvData = products.map(product => 
      `${product.id},"${product.name}","${product.sku}","${product.category}","${product.purity}",${product.weight},${product.cost_price},${product.selling_price},${product.stock_quantity}`
    ).join('\n');
    
    const csv = csvHeaders + csvData;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV',
      error: error.message
    });
  }
};

// Upload CSV (placeholder)
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    // Process CSV file here
    res.json({
      success: true,
      message: 'CSV upload functionality to be implemented'
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload CSV',
      error: error.message
    });
  }
};

// ADD THIS NEW FUNCTION at the end of the file, BEFORE module.exports:
const getAllTags = async (req, res) => {
  try {
    // Check if tags column exists by trying a simple query first
    const products = await Product.findAll({
      attributes: ['id', 'tags'],
      where: {
        is_active: true
      },
      limit: 10
    });

    const allTags = new Set();
    
    products.forEach(product => {
      if (product.tags) {
        // Handle both string and array formats
        let tags = product.tags;
        if (typeof tags === 'string') {
          tags = tags.split(',').map(tag => tag.trim());
        }
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      }
    });

    res.json({
      success: true,
      data: Array.from(allTags).sort()
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    
    // If tags column doesn't exist, return empty array
    if (error.message.includes('no such column: tags') || error.message.includes('column "tags" does not exist')) {
      res.json({
        success: true,
        data: [],
        message: 'Tags column not found, returning empty tags list'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tags',
        error: error.message
      });
    }
  }
};

// Add this new function before module.exports
const exportExcel = async (req, res) => {
  try {
    console.log('Starting Excel export...');
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');
    
    // Define columns with proper headers and widths
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Subcategory', key: 'subcategory', width: 15 },
      { header: 'Metal Type', key: 'metal_type', width: 12 },
      { header: 'Purity', key: 'purity', width: 10 },
      { header: 'Weight (g)', key: 'weight', width: 12 },
      { header: 'Stone Type', key: 'stone_type', width: 15 },
      { header: 'Stone Weight (ct)', key: 'stone_weight', width: 15 },
      { header: 'Cost Price (₹)', key: 'cost_price', width: 15 },
      { header: 'Selling Price (₹)', key: 'selling_price', width: 15 },
      { header: 'Discount %', key: 'discount_percentage', width: 12 },
      { header: 'Stock Quantity', key: 'stock_quantity', width: 15 },
      { header: 'Reorder Level', key: 'reorder_level', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Tags', key: 'tags', width: 30 },
      { header: 'Status', key: 'is_active', width: 10 },
      { header: 'Created Date', key: 'created_at', width: 18 },
      { header: 'Description', key: 'description', width: 40 }
    ];

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Fetch all products from database
    const products = await Product.findAll({
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${products.length} products to export`);

    // Add product data to worksheet
    products.forEach((product) => {
      const row = worksheet.addRow({
        id: product.id,
        name: product.name || 'N/A',
        sku: product.sku || 'N/A',
        barcode: product.barcode || 'N/A',
        category: product.category || 'N/A',
        subcategory: product.subcategory || 'N/A',
        metal_type: product.metal_type || 'N/A',
        purity: product.purity || 'N/A',
        weight: product.weight || 0,
        stone_type: product.stone_type || 'N/A',
        stone_weight: product.stone_weight || 0,
        cost_price: product.cost_price || 0,
        selling_price: product.selling_price || 0,
        discount_percentage: product.discount_percentage || 0,
        stock_quantity: product.stock_quantity || 0,
        reorder_level: product.reorder_level || 0,
        supplier: product.supplier || 'N/A',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || 'N/A'),
        is_active: product.is_active ? 'Active' : 'Inactive',
        created_at: product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A',
        description: product.description || 'N/A'
      });

      // Add borders to data rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary information
    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = 'Summary:';
    summaryRow.getCell(1).font = { bold: true };
    
    const totalProductsRow = worksheet.addRow({});
    totalProductsRow.getCell(1).value = 'Total Products:';
    totalProductsRow.getCell(2).value = products.length;
    
    const activeProductsRow = worksheet.addRow({});
    activeProductsRow.getCell(1).value = 'Active Products:';
    activeProductsRow.getCell(2).value = products.filter(p => p.is_active).length;
    
    const totalValueRow = worksheet.addRow({});
    totalValueRow.getCell(1).value = 'Total Inventory Value:';
    totalValueRow.getCell(2).value = `₹${products.reduce((sum, p) => sum + (parseFloat(p.selling_price) || 0), 0).toFixed(2)}`;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `products-export-${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    
    console.log(`Excel export completed: ${filename}`);
    res.end();

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data to Excel',
      error: error.message
    });
  }
};

// Update module.exports to include the new function
module.exports = {
  createProduct,
  updateProduct,
  uploadImages,
  deleteImage,
  getProducts,
  getProductById,
  searchProducts,
  getProductByBarcode,
  getProductBySku,
  deleteProduct,
  exportCSV,
  uploadCSV,
  getAllTags,
  exportExcel  // ADD THIS LINE
};