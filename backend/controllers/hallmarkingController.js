const Hallmarking = require('../models/Hallmarking');
const Product = require('../models/Product');

exports.createHallmarking = async (req, res) => {
  try {
    const { product_id, bis_certificate_no, assay_center, date_of_certification } = req.body;
    
    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if hallmarking already exists for this product
    const existingHallmarking = await Hallmarking.findOne({ where: { product_id } });
    if (existingHallmarking) {
      return res.status(400).json({
        success: false,
        message: 'Hallmarking record already exists for this product'
      });
    }
    
    const hallmarking = await Hallmarking.create({
      product_id,
      bis_certificate_no,
      assay_center,
      date_of_certification: new Date(date_of_certification)
    });
    
    res.status(201).json({
      success: true,
      message: 'Hallmarking record created successfully',
      hallmarking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.getHallmarkingByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const hallmarking = await Hallmarking.findOne({ where: { product_id } });
    
    if (!hallmarking) {
      return res.status(404).json({
        success: false,
        message: 'Hallmarking record not found'
      });
    }
    
    res.json({
      success: true,
      hallmarking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getAllHallmarking = async (req, res) => {
  try {
    const hallmarking = await Hallmarking.findAll({
      include: [{
        model: Product,
        attributes: ['name', 'barcode', 'purity']
      }],
      order: [['date_of_certification', 'DESC']]
    });
    
    res.json({
      success: true,
      hallmarking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.updateHallmarking = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Hallmarking.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Hallmarking record not found'
      });
    }
    
    const hallmarking = await Hallmarking.findByPk(id);
    res.json({
      success: true,
      message: 'Hallmarking record updated successfully',
      hallmarking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.deleteHallmarking = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Hallmarking.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Hallmarking record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hallmarking record deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.verifyHallmarking = async (req, res) => {
  try {
    const { bis_certificate_no } = req.params;
    const hallmarking = await Hallmarking.findOne({ 
      where: { bis_certificate_no },
      include: [{
        model: Product,
        attributes: ['name', 'barcode', 'purity', 'weight']
      }]
    });
    
    if (!hallmarking) {
      return res.status(404).json({
        success: false,
        message: 'Hallmarking certificate not found'
      });
    }
    
    res.json({
      success: true,
      hallmarking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 