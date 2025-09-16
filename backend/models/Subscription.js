const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subscription extends Model {
    static associate(models) {
      // Subscription belongs to User (organization/business)
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Instance method to check if subscription is active
    isActive() {
      if (this.tier === 'lifetime') return true;
      if (this.tier === 'freemium') return true;
      if (this.tier === 'pay_per_use') return this.credits > 0;
      
      // For monthly/yearly subscriptions
      return this.expires_at && new Date(this.expires_at) > new Date();
    }

    // Check if user has reached product limit
    hasReachedProductLimit(currentProductCount) {
      const limits = {
        freemium: 50,
        starter: 200,
        professional: 1000,
        enterprise: -1, // unlimited
        lifetime: -1, // unlimited
        pay_per_use: -1 // unlimited but costs per transaction
      };
      
      const limit = limits[this.tier];
      return limit !== -1 && currentProductCount >= limit;
    }

    // Check if user has reached transaction limit (for pay-per-use)
    hasTransactionCredits() {
      if (this.tier !== 'pay_per_use') return true;
      return this.credits > 0;
    }

    // Get feature access based on tier
    getFeatureAccess() {
      const features = {
        freemium: {
          max_products: 50,
          max_transactions_per_month: 100,
          advanced_analytics: false,
          profit_loss_reports: false,
          multi_user: false,
          api_access: false,
          custom_invoicing: false,
          inventory_alerts: false,
          backup_export: false
        },
        starter: {
          max_products: 200,
          max_transactions_per_month: 500,
          advanced_analytics: true,
          profit_loss_reports: true,
          multi_user: false,
          api_access: false,
          custom_invoicing: true,
          inventory_alerts: true,
          backup_export: true
        },
        professional: {
          max_products: 1000,
          max_transactions_per_month: 2000,
          advanced_analytics: true,
          profit_loss_reports: true,
          multi_user: true,
          api_access: true,
          custom_invoicing: true,
          inventory_alerts: true,
          backup_export: true
        },
        enterprise: {
          max_products: -1, // unlimited
          max_transactions_per_month: -1, // unlimited
          advanced_analytics: true,
          profit_loss_reports: true,
          multi_user: true,
          api_access: true,
          custom_invoicing: true,
          inventory_alerts: true,
          backup_export: true
        },
        lifetime: {
          max_products: -1, // unlimited
          max_transactions_per_month: -1, // unlimited
          advanced_analytics: true,
          profit_loss_reports: true,
          multi_user: true,
          api_access: true,
          custom_invoicing: true,
          inventory_alerts: true,
          backup_export: true
        },
        pay_per_use: {
          max_products: -1, // unlimited
          max_transactions_per_month: -1, // unlimited (but costs per transaction)
          advanced_analytics: true,
          profit_loss_reports: true,
          multi_user: false,
          api_access: false,
          custom_invoicing: true,
          inventory_alerts: true,
          backup_export: true
        }
      };

      return features[this.tier] || features.freemium;
    }
  }

  Subscription.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tier: {
      type: DataTypes.ENUM(
        'freemium',      // Free tier - 50 products max
        'starter',       // ₹999/month - 200 products
        'professional',  // ₹2999/month - 1000 products
        'enterprise',    // ₹5999/month - unlimited
        'lifetime',      // ₹49,999 one-time - unlimited
        'pay_per_use'    // ₹10 per transaction - seasonal
      ),
      allowNull: false,
      defaultValue: 'freemium'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'cancelled'),
      defaultValue: 'active'
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'yearly', 'lifetime', 'pay_per_use'),
      allowNull: true
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR'
    },
    starts_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true // null for lifetime and pay-per-use
    },
    // For pay-per-use model
    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of transactions available for pay-per-use model'
    },
    // Hybrid model: base fee + storage costs
    storage_gb_used: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00
    },
    storage_cost_per_gb: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 50.00, // ₹50 per GB per month
      comment: 'Cost per GB for hybrid model cloud storage'
    },
    // Payment tracking
    last_payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_billing_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'upi', 'bank_transfer', 'cash'),
      allowNull: true
    },
    payment_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment gateway transaction ID or reference'
    },
    // Trial period
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Maintenance for lifetime users
    annual_maintenance_fee: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 5999.00,
      comment: 'Optional annual maintenance fee for lifetime users'
    },
    maintenance_paid_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Usage tracking
    current_product_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    monthly_transaction_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Notes and metadata
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional subscription metadata (promotions, discounts, etc.)'
    }
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['tier']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  return Subscription;
};
