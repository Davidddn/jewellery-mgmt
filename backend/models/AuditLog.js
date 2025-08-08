const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if action is by system or unauthenticated
      references: {
        model: 'users', // This is the table name of the User model
        key: 'id',
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., LOGIN, LOGOUT, PRODUCT_CREATED, USER_UPDATED'
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., User, Product, Customer'
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the entity affected by the action'
    },
    details: {
      type: DataTypes.JSON, // Use JSON type for flexible storage of details
      allowNull: true,
      comment: 'Additional details about the action (e.g., old_value, new_value)'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs', // Explicit table name
    timestamps: true, // Adds createdAt and updatedAt
    updatedAt: false, // Audit logs typically only have a creation timestamp
    createdAt: 'timestamp' // Rename createdAt to timestamp for audit purposes
  });

  // Define association if AuditLog belongs to a User
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
};
