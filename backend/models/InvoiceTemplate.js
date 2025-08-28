module.exports = (sequelize, DataTypes) => {
  const InvoiceTemplate = sequelize.define('InvoiceTemplate', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Default',
    },
    template: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  }, {
    indexes: [
      { unique: true, fields: ['user_id', 'name'] }
    ]
  });
  return InvoiceTemplate;
};
