/**
 * Competitive Pricing Models Configuration
 * Designed to attract different types of jewelry business clients
 */

const PRICING_PLANS = {
  freemium: {
    name: 'Freemium',
    description: 'Perfect for small shops just getting started',
    price: 0,
    billing_cycle: 'free',
    currency: 'INR',
    trial_days: 0,
    features: {
      max_products: 50,
      max_transactions_per_month: 100,
      max_users: 1,
      storage_gb: 1,
      advanced_analytics: false,
      profit_loss_reports: false,
      multi_user: false,
      api_access: false,
      custom_invoicing: false,
      inventory_alerts: false,
      backup_export: false,
      priority_support: false
    },
    limitations: [
      'Limited to 50 products',
      'Basic reporting only',
      'Single user account',
      'Limited customer support'
    ],
    target_audience: 'Small jewelry shops, home-based businesses, startups',
    competitive_advantage: 'Zero cost entry point - no competitor offers 50 products free'
  },

  starter: {
    name: 'Starter',
    description: 'Growing businesses with expanding inventory',
    price: 999,
    billing_cycle: 'monthly',
    yearly_price: 9999, // 2 months free
    currency: 'INR',
    trial_days: 14,
    features: {
      max_products: 200,
      max_transactions_per_month: 500,
      max_users: 2,
      storage_gb: 5,
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: false,
      api_access: false,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: false
    },
    limitations: [
      'Limited to 200 products',
      'Basic multi-user (2 users)',
      'Standard support'
    ],
    target_audience: 'Small to medium jewelry retailers',
    competitive_advantage: 'Most affordable monthly plan with P&L reports'
  },

  professional: {
    name: 'Professional',
    description: 'Established businesses with multiple locations',
    price: 2999,
    billing_cycle: 'monthly',
    yearly_price: 29999, // 20% discount
    currency: 'INR',
    trial_days: 30,
    features: {
      max_products: 1000,
      max_transactions_per_month: 2000,
      max_users: 5,
      storage_gb: 20,
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: true,
      api_access: true,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: true
    },
    limitations: [
      'Limited to 1000 products',
      'Up to 5 users'
    ],
    target_audience: 'Medium to large jewelry retailers, chain stores',
    competitive_advantage: 'Comprehensive features at competitive price point'
  },

  enterprise: {
    name: 'Enterprise',
    description: 'Large businesses with unlimited needs',
    price: 5999,
    billing_cycle: 'monthly',
    yearly_price: 59999, // 17% discount
    currency: 'INR',
    trial_days: 30,
    features: {
      max_products: -1, // unlimited
      max_transactions_per_month: -1, // unlimited
      max_users: -1, // unlimited
      storage_gb: 100,
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: true,
      api_access: true,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: true,
      custom_development: true,
      dedicated_account_manager: true
    },
    limitations: [],
    target_audience: 'Large jewelry chains, wholesale businesses, enterprises',
    competitive_advantage: 'White-glove service with dedicated support'
  },

  lifetime: {
    name: 'Lifetime License',
    description: 'One-time payment, lifetime access',
    price: 49999,
    billing_cycle: 'lifetime',
    currency: 'INR',
    trial_days: 30,
    annual_maintenance: {
      optional: true,
      price: 5999,
      description: 'Optional annual maintenance for updates and support'
    },
    features: {
      max_products: -1, // unlimited
      max_transactions_per_month: -1, // unlimited
      max_users: 3, // reasonable limit for lifetime
      storage_gb: 50,
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: true,
      api_access: true,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: false, // only with maintenance
      lifetime_updates: true
    },
    limitations: [
      'Support requires annual maintenance',
      'Limited to 3 users (upgradable)'
    ],
    target_audience: 'Established businesses wanting to avoid recurring costs',
    competitive_advantage: 'No competitor offers lifetime license - unique selling point'
  },

  pay_per_use: {
    name: 'Pay-per-Use',
    description: 'Perfect for seasonal or occasional sellers',
    price: 10,
    billing_cycle: 'pay_per_use',
    currency: 'INR',
    trial_days: 0,
    cost_structure: {
      per_transaction: 10,
      bulk_packages: [
        { transactions: 50, price: 450, savings: 50 }, // 10% discount
        { transactions: 100, price: 850, savings: 150 }, // 15% discount
        { transactions: 200, price: 1600, savings: 400 } // 20% discount
      ]
    },
    features: {
      max_products: -1, // unlimited
      max_transactions_per_month: -1, // unlimited but paid per use
      max_users: 1,
      storage_gb: 2,
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: false,
      api_access: false,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: false
    },
    limitations: [
      'Single user only',
      'Pay per transaction',
      'Basic support'
    ],
    target_audience: 'Seasonal sellers, exhibition vendors, occasional sellers',
    competitive_advantage: 'Only flexible pay-per-transaction model in market'
  },

  hybrid: {
    name: 'Hybrid Cloud',
    description: 'Low base fee + cloud storage costs',
    base_price: 499,
    storage_cost_per_gb: 50,
    billing_cycle: 'monthly',
    currency: 'INR',
    trial_days: 14,
    features: {
      max_products: 500,
      max_transactions_per_month: 1000,
      max_users: 3,
      storage_gb: 'pay_as_you_go',
      advanced_analytics: true,
      profit_loss_reports: true,
      multi_user: true,
      api_access: false,
      custom_invoicing: true,
      inventory_alerts: true,
      backup_export: true,
      priority_support: false
    },
    limitations: [
      'Storage costs extra (₹50/GB/month)',
      'Limited to 500 products'
    ],
    target_audience: 'Businesses with variable storage needs',
    competitive_advantage: 'Flexible storage pricing - pay only for what you use'
  }
};

const PROMOTIONAL_OFFERS = {
  new_user_discount: {
    name: 'Welcome Discount',
    description: '30% off first 3 months',
    discount_percentage: 30,
    duration_months: 3,
    applicable_plans: ['starter', 'professional', 'enterprise'],
    code: 'WELCOME30'
  },
  
  annual_discount: {
    name: 'Annual Saver',
    description: 'Save 20% with annual billing',
    discount_percentage: 20,
    billing_cycle: 'yearly',
    applicable_plans: ['starter', 'professional', 'enterprise']
  },

  festival_offer: {
    name: 'Festival Special',
    description: 'Diwali/Akshaya Tritiya special pricing',
    discount_percentage: 25,
    duration_months: 1,
    applicable_plans: ['starter', 'professional', 'enterprise', 'lifetime'],
    seasonal: true
  },

  bulk_transaction_discount: {
    name: 'High Volume Discount',
    description: 'Bulk transaction packages for pay-per-use',
    discount_structure: [
      { min_transactions: 50, discount_percentage: 10 },
      { min_transactions: 100, discount_percentage: 15 },
      { min_transactions: 200, discount_percentage: 20 }
    ],
    applicable_plans: ['pay_per_use']
  }
};

const COMPETITIVE_ANALYSIS = {
  unique_selling_points: [
    'Only free tier offering 50 products (competitors limit to 10-20)',
    'Lifetime license option (unique in jewelry software market)',
    'Pay-per-use model for seasonal vendors (no competitor offers this)',
    'Hybrid storage pricing (flexible cost structure)',
    'India-specific features (GST, Indian currency, local business practices)',
    'Comprehensive jewelry-specific features at competitive prices'
  ],
  
  market_positioning: {
    against_international_competitors: [
      'Significantly lower pricing for Indian market',
      'Local currency and payment methods',
      'India-specific compliance features'
    ],
    against_local_competitors: [
      'More flexible pricing models',
      'Better feature-to-price ratio',
      'Modern web-based solution vs legacy desktop software'
    ]
  }
};

const MIGRATION_PATHS = {
  freemium_to_paid: [
    'Automatic upgrade prompts when approaching limits',
    'Feature showcasing to demonstrate value',
    'Limited-time upgrade discounts'
  ],
  
  seasonal_to_regular: [
    'Convert pay-per-use customers to monthly plans',
    'Show cost savings for regular usage',
    'Seasonal to annual plan transitions'
  ],
  
  trial_conversion: [
    'Progressive feature unlocking during trial',
    'Personal onboarding calls for enterprise trials',
    'Extended trials for serious prospects'
  ]
};

module.exports = {
  PRICING_PLANS,
  PROMOTIONAL_OFFERS,
  COMPETITIVE_ANALYSIS,
  MIGRATION_PATHS
};
