const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    value: {
      type: DataTypes.TEXT, // Use TEXT for longer values
      allowNull: true,
      defaultValue: ''
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    // Fix the column naming issue
    underscored: false, // Use camelCase (createdAt, updatedAt)
    createdAt: 'created_at', // Map to snake_case if your DB uses it
    updatedAt: 'updated_at', // Map to snake_case if your DB uses it
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ]
  });

  return Setting;
};
