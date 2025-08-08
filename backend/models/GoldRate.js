const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GoldRate = sequelize.define('GoldRate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    purity: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['24K', '22K', '18K']]
      }
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    last_updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'gold_rates',
    timestamps: true,
    underscored: true
  });

  return GoldRate;
};
