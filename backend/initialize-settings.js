const { sequelize } = require('./models');
const { Setting } = require('./models');
const fs = require('fs');
const path = require('path');

async function initializeSettings() {
  try {
    console.log('🔧 Jewellery Management System - Settings Initialization');
    console.log('=====================================================');
    console.log('🚀 Starting settings initialization...');
    
    // Use force: false to avoid altering existing tables
    console.log('📊 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    // Sync only the Settings table, don't alter existing tables
    console.log('📋 Syncing Settings table...');
    try {
      await Setting.sync({ force: false }); // Don't alter existing data
      console.log('✅ Settings table synced successfully');
    } catch (syncError) {
      console.log('ℹ️ Settings table already exists, continuing...');
    }

    // Check if settings already exist
    console.log('🔍 Checking existing settings...');
    const existingSettings = await Setting.findAll();
    
    if (existingSettings.length === 0) {
      console.log('📝 No settings found, creating default settings...');
      
      // Create essential default settings for jewellery business
      const defaultSettings = [
        // Basic Business Information
        { key: 'shop_name', value: 'My Jewellery Shop' },
        { key: 'shop_address', value: 'Enter your shop address here' },
        { key: 'gst_percentage', value: '18' },
        { key: 'phone', value: '' },
        { key: 'email', value: '' },
        { key: 'website', value: '' },
        { key: 'established_year', value: '' },
        
        // Currency & Financial
        { key: 'currency', value: 'INR' },
        { key: 'currency_symbol', value: '₹' },
        
        // Legal & Tax Information
        { key: 'tax_number', value: '' },
        { key: 'gst_number', value: '' },
        { key: 'pan_number', value: '' },
        
        // Banking Information
        { key: 'bank_name', value: '' },
        { key: 'bank_account', value: '' },
        { key: 'bank_ifsc', value: '' },
        
        // Business Settings
        { key: 'business_type', value: 'retail' },
        { key: 'invoice_prefix', value: 'INV' },
        { key: 'invoice_footer', value: 'Thank you for your business!' },
        
        // System Settings
        { key: 'date_format', value: 'DD/MM/YYYY' },
        { key: 'currency_position', value: 'before' }, // ₹100 vs 100₹
        { key: 'decimal_places', value: '2' },
        
        // Inventory Settings
        { key: 'low_stock_alert', value: '5' },
        { key: 'auto_generate_sku', value: 'true' },
        { key: 'sku_prefix', value: 'JWL' },
        
        // Customer Settings
        { key: 'loyalty_program', value: 'true' },
        { key: 'loyalty_points_rate', value: '1' },
        
        // Security Settings
        { key: 'session_timeout', value: '30' },
        { key: 'backup_frequency', value: 'daily' }
      ];

      // Insert settings one by one with error handling
      let successCount = 0;
      for (const setting of defaultSettings) {
        try {
          await Setting.create(setting);
          successCount++;
        } catch (error) {
          console.log(`⚠️ Warning: Could not create setting ${setting.key}: ${error.message}`);
        }
      }

      console.log(`✅ Created ${successCount}/${defaultSettings.length} default settings`);
      
    } else {
      console.log(`ℹ️ Found ${existingSettings.length} existing settings, checking for missing ones...`);
      
      // Check for essential missing settings and add them
      const existingKeys = existingSettings.map(s => s.key);
      const essentialKeys = [
        'shop_name', 'shop_address', 'gst_percentage', 'phone', 'email',
        'currency', 'currency_symbol', 'business_type'
      ];
      
      const missingKeys = essentialKeys.filter(key => !existingKeys.includes(key));
      
      if (missingKeys.length > 0) {
        console.log(`📝 Adding ${missingKeys.length} missing essential settings...`);
        
        const essentialDefaults = {
          'shop_name': 'My Jewellery Shop',
          'shop_address': 'Enter your shop address here',
          'gst_percentage': '18',
          'phone': '',
          'email': '',
          'currency': 'INR',
          'currency_symbol': '₹',
          'business_type': 'retail'
        };
        
        for (const key of missingKeys) {
          try {
            await Setting.create({
              key: key,
              value: essentialDefaults[key] || ''
            });
            console.log(`✅ Added missing setting: ${key}`);
          } catch (error) {
            console.log(`⚠️ Could not add setting ${key}: ${error.message}`);
          }
        }
      }
      
      // Display some existing settings
      console.log('📋 Current settings:');
      const keySettings = ['shop_name', 'gst_percentage', 'currency'];
      for (const key of keySettings) {
        const setting = existingSettings.find(s => s.key === key);
        if (setting) {
          console.log(`   - ${key}: ${setting.value}`);
        }
      }
    }

    // Ensure uploads directory exists for logos and files
    console.log('📁 Setting up file directories...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Create subdirectories for organized file storage
    const subdirs = ['logos', 'products', 'documents'];
    subdirs.forEach(subdir => {
      const subdirPath = path.join(uploadsDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
        console.log(`✅ Created uploads/${subdir} directory`);
      }
    });

    console.log('');
    console.log('🎉 Settings initialization completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - Database connection verified');
    console.log('   - Settings table ready');
    console.log('   - Default/missing settings created');
    console.log('   - Upload directories created');
    console.log('   - System ready for use');
    console.log('');
    console.log('🚀 You can now start your server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error initializing settings:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting suggestions:');
    console.error('   1. Make sure no other processes are using the database');
    console.error('   2. Try stopping your development server first');
    console.error('   3. Check database file permissions');
    console.error('   4. If the error persists, try running: npm run dev (server should create missing tables)');
    
    // Don't exit with error code, just warn
    console.log('');
    console.log('💡 Note: You can also let the server create the settings table automatically');
    console.log('   Just start the server with: npm run dev');
  }
  
  process.exit(0);
}

// Run the initialization
initializeSettings();