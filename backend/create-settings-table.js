const { sequelize } = require('./models');

async function createSettingsTable() {
  try {
    console.log('🔧 Creating Settings Table Manually');
    console.log('===================================');
    
    // Create the table manually with correct column names
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Settings table created successfully');
    
    // Insert default settings
    const defaultSettings = [
      ['shop_name', 'My Jewellery Shop'],
      ['shop_address', 'Enter your shop address here'],
      ['gst_percentage', '18'],
      ['phone', ''],
      ['email', ''],
      ['website', ''],
      ['currency', 'INR'],
      ['currency_symbol', '₹'],
      ['gst_number', ''],
      ['pan_number', ''],
      ['tax_number', ''],
      ['bank_name', ''],
      ['bank_account', ''],
      ['bank_ifsc', ''],
      ['business_type', 'retail'],
      ['established_year', '']
    ];
    
    console.log('📝 Inserting default settings...');
    
    for (const [key, value] of defaultSettings) {
      try {
        await sequelize.query(`
          INSERT OR IGNORE INTO settings (key, value, created_at, updated_at) 
          VALUES (?, ?, datetime('now'), datetime('now'))
        `, {
          replacements: [key, value]
        });
        console.log(`✅ Added: ${key} = ${value || '(empty)'}`);
      } catch (error) {
        console.log(`⚠️ Skipped: ${key} (already exists)`);
      }
    }
    
    // Verify settings were created
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM settings');
    console.log(`✅ Total settings in database: ${results[0].count}`);
    
    // Show sample settings
    const [sampleSettings] = await sequelize.query('SELECT key, value FROM settings LIMIT 5');
    console.log('📋 Sample settings:');
    sampleSettings.forEach(setting => {
      console.log(`   - ${setting.key}: ${setting.value || '(empty)'}`);
    });
    
    console.log('');
    console.log('🎉 Settings table and data created successfully!');
    console.log('🚀 You can now start your server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error creating settings table:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

createSettingsTable();