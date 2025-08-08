const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Loyalty extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
      this.belongsTo(models.Transaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });
    }
  }

  Loyalty.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
    },
    // Standardized single field to match controller logic
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    redeemed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Loyalty',
    tableName: 'loyalty',
    timestamps: true,
    underscored: true,
  });
  return Loyalty;
};