const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Hallmarking = sequelize.define('Hallmarking', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products', // This is the table name of the Product model
        key: 'id',
      }
    },
    hallmark_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    certifying_authority: {
      type: DataTypes.STRING,
      allowNull: true
    },
    certification_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    purity_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    weight_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'hallmarking',
    timestamps: true, // Adds createdAt and updatedAt
    underscored: true // Use snake_case
  });

  // Define associations
  Hallmarking.associate = (models) => {
    Hallmarking.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return Hallmarking;
};
