const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const TransactionItem = sequelize.define('TransactionItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'transaction_items',
    timestamps: true, // Adds createdAt and updatedAt
    underscored: true // Use snake_case
  });

  // Define associations
  TransactionItem.associate = (models) => {
    TransactionItem.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
    TransactionItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  // --- Custom methods (re-implemented using Sequelize) ---

  // Get items by transaction
  TransactionItem.getByTransaction = async function(transactionId) {
    return this.findAll({
      where: { transaction_id: transactionId },
      include: [{ model: sequelize.models.Product, as: 'product', attributes: ['name', 'sku', 'barcode'] }]
    });
  };

  // Get items by product
  TransactionItem.getByProduct = async function(productId) {
    return this.findAll({
      where: { product_id: productId },
      include: [{ model: sequelize.models.Transaction, as: 'transaction', attributes: ['id', 'transaction_type', 'created_at'] }],
      order: [['transaction', 'created_at', 'DESC']] // Order by transaction date
    });
  };

  // Get sales statistics by product
  TransactionItem.getProductSalesStats = async function(productId, startDate = null, endDate = null) {
    const Op = sequelize.Op;
    let whereClause = {
      product_id: productId,
      '$transaction.transaction_type$': 'sale' // Access associated model's column
    };
    
    if (startDate && endDate) {
      whereClause['$transaction.created_at$'] = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    return this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('TransactionItem.id')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_price']
      ],
      where: whereClause,
      include: [{
        model: sequelize.models.Transaction,
        as: 'transaction',
        attributes: [], // Don't select transaction attributes directly
        required: true // INNER JOIN
      }]
    });
  };

  // Get top selling products
  TransactionItem.getTopSellingProducts = async function(limit = 10) {
    return this.findAll({
      attributes: [
        'product_id',
        [sequelize.col('product.name'), 'name'],
        [sequelize.col('product.sku'), 'sku'],
        [sequelize.fn('SUM', sequelize.col('TransactionItem.quantity')), 'total_quantity_sold'],
        [sequelize.fn('SUM', sequelize.col('TransactionItem.total_price')), 'total_revenue']
      ],
      include: [{
        model: sequelize.models.Product,
        as: 'product',
        attributes: [], // Don't select product attributes directly
        required: true // INNER JOIN
      }, {
        model: sequelize.models.Transaction,
        as: 'transaction',
        attributes: [],
        where: { transaction_type: 'sale' },
        required: true
      }],
      group: ['product_id', 'product.name', 'product.sku'],
      order: [[sequelize.literal('total_quantity_sold'), 'DESC']],
      limit: limit
    });
  };

  // Get daily sales
  TransactionItem.getDailySales = async function(date) {
    // Ensure date is in 'YYYY-MM-DD' format if needed for SQLite DATE function
    return this.findAll({
      attributes: [
        'product_id',
        [sequelize.col('product.name'), 'product_name'],
        [sequelize.fn('SUM', sequelize.col('TransactionItem.quantity')), 'quantity_sold'],
        [sequelize.fn('SUM', sequelize.col('TransactionItem.total_price')), 'revenue']
      ],
      include: [{
        model: sequelize.models.Product,
        as: 'product',
        attributes: [],
        required: true
      }, {
        model: sequelize.models.Transaction,
        as: 'transaction',
        attributes: [],
        where: {
          transaction_type: 'sale',
          created_at: {
            [sequelize.Op.gte]: new Date(date).setHours(0, 0, 0, 0),
            [sequelize.Op.lt]: new Date(date).setHours(23, 59, 59, 999)
          }
        },
        required: true
      }],
      group: ['product_id', 'product.name'],
      order: [[sequelize.literal('revenue'), 'DESC']]
    });
  };

  return TransactionItem;
};
