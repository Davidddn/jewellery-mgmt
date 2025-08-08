const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_spent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    tableName: 'customers',
    timestamps: true, // Adds createdAt and updatedAt
    underscored: true // Use snake_case for column names (e.g., date_of_birth)
  });

  // Define associations if any
  Customer.associate = (models) => {
    Customer.hasMany(models.Transaction, { foreignKey: 'customer_id', as: 'transactions' });
    Customer.hasOne(models.Loyalty, { foreignKey: 'customer_id', as: 'loyalty' });
  };

  return Customer;
};
