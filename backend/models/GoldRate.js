module.exports = (sequelize, DataTypes) => {
  const GoldRate = sequelize.define('GoldRate', {
    rate_22k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    rate_18k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    rate_24k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });

  return GoldRate;
};