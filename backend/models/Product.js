const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      this.hasMany(models.TransactionItem, {
        foreignKey: 'product_id',
        as: 'transactionItems'
      });
      this.hasOne(models.Hallmarking, {
        foreignKey: 'product_id',
        as: 'hallmarking'
      });
    }
  }

  Product.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    category: {
      type: DataTypes.STRING(50),
    },
    subcategory: {
      type: DataTypes.STRING(50),
    },
    sku: {
      type: DataTypes.STRING(50),
      unique: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
    },
    weight: {
      type: DataTypes.DECIMAL(8, 3),
    },
    purity: {
      type: DataTypes.STRING(20),
    },
    metal_type: {
      type: DataTypes.STRING(30),
    },
    stone_type: {
      type: DataTypes.STRING(30),
    },
    stone_weight: {
      type: DataTypes.DECIMAL(8, 3),
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    // Standardized field name
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    supplier: {
      type: DataTypes.STRING(100),
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    image_url: {
      type: DataTypes.STRING(255),
    },
    back_image_url: {
      type: DataTypes.STRING(255),
    },
    // ADD THIS NEW FIELD FOR TAGS
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comma-separated tags for search and categorization',
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? rawValue.split(',').map(tag => tag.trim()) : [];
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('tags', value.join(','));
        } else if (typeof value === 'string') {
          this.setDataValue('tags', value);
        } else {
          this.setDataValue('tags', null);
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true,
  });
  return Product;
};