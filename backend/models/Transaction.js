const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      this.hasMany(models.TransactionItem, {
        foreignKey: 'transaction_id',
        as: 'items'
      });
      this.hasOne(models.Loyalty, {
        foreignKey: 'transaction_id',
        as: 'loyalty'
      });
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'customers',
        key: 'id'
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
    },
    transaction_type: {
      type: DataTypes.ENUM('sale', 'purchase', 'return', 'exchange'),
      defaultValue: 'sale',
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(30),
    },
    payment_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
    },
    transaction_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'completed',
    },
    notes: {
      type: DataTypes.TEXT,
    },
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
  });
  return Transaction;
};