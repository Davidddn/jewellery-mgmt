const { sequelize } = require('../models');
const path = require('path');
const fs = require('fs');

// Get all settings using raw SQL
exports.getSettings = async (req, res) => {
  try {
    console.log('🔍 Fetching settings from database...');
    
    const [results] = await sequelize.query('SELECT * FROM settings');
    console.log(`✅ Found ${results.length} settings in database`);
    
    if (!results || results.length === 0) {
      console.log('⚠️ No settings found, returning default values');
      return res.json({
        shop_name: 'My Jewellery Shop',
        shop_address: 'Enter your shop address here',
        gst_percentage: '18',
        phone: '',
        email: '',
        website: '',
        established_year: '',
        currency: 'INR',
        currency_symbol: '₹',
        tax_number: '',
        gst_number: '',
        pan_number: '',
        bank_name: '',
        bank_account: '',
        bank_ifsc: ''
      });
    }
    
    // Convert to object
    const settingsMap = {};
    results.forEach(setting => {
      if (setting && setting.key && setting.value !== undefined) {
        settingsMap[setting.key] = setting.value;
      }
    });
    
    console.log(`✅ Processed ${Object.keys(settingsMap).length} settings`);
    res.json(settingsMap);
    
  } catch (err) {
    console.error('❌ Error in getSettings:', err);
    res.status(500).json({ 
      message: 'Failed to fetch settings',
      error: err.message 
    });
  }
};

// Update settings using raw SQL
exports.updateSettings = async (req, res) => {
  try {
    console.log('🔍 Updating settings...');
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }
    
    let updateCount = 0;
    
    for (const key in settings) {
      if (settings.hasOwnProperty(key) && settings[key] !== undefined) {
        try {
          await sequelize.query(`
            INSERT INTO settings (key, value, created_at, updated_at) 
            VALUES (?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(key) DO UPDATE SET 
            value = excluded.value,
            updated_at = datetime('now')
          `, {
            replacements: [key, String(settings[key])]
          });
          
          updateCount++;
          console.log(`✅ Updated: ${key} = ${settings[key]}`);
        } catch (error) {
          console.log(`⚠️ Failed to update ${key}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Updated ${updateCount} settings`);
    res.json({ 
      message: 'Settings updated successfully',
      updated: updateCount
    });
    
  } catch (err) {
    console.error('❌ Error in updateSettings:', err);
    res.status(500).json({ 
      message: 'Failed to update settings',
      error: err.message 
    });
  }
};

// Dynamic logo detection - finds any uploaded logo
exports.getLogo = (req, res) => {
  try {
    console.log('🔍 Searching for uploaded logo...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Uploads directory does not exist');
      return res.status(404).json({ message: 'No logo found - uploads directory missing' });
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log('📁 Files in uploads directory:', files);
    
    const logoFiles = files.filter(file => {
      const isLogo = file.toLowerCase().includes('logo') && 
                    (file.toLowerCase().endsWith('.jpg') || 
                     file.toLowerCase().endsWith('.jpeg') || 
                     file.toLowerCase().endsWith('.png'));
      return isLogo;
    });
    
    console.log('🖼️ Found logo files:', logoFiles);
    
    if (logoFiles.length === 0) {
      console.log('⚠️ No logo files found');
      return res.status(404).json({ message: 'No logo found' });
    }
    
    const latestLogo = logoFiles.sort().pop();
    const logoPath = path.join(uploadsDir, latestLogo);
    
    console.log(`✅ Using logo: ${latestLogo}`);
    console.log(`✅ Full path: ${logoPath}`);
    
    // Set proper headers for image response - LET EXPRESS HANDLE CACHE
    const ext = path.extname(latestLogo).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    res.setHeader('Content-Type', mimeType);
    // Remove manual cache headers - let express handle them
    
    // Send the file
    res.sendFile(logoPath);
    
  } catch (error) {
    console.error('❌ Error in getLogo:', error);
    res.status(500).json({ 
      message: 'Failed to fetch logo',
      error: error.message 
    });
  }
};

// Upload a new logo (keeps timestamp naming)
exports.uploadLogo = (req, res) => {
  try {
    console.log('🔍 Processing logo upload...');
    console.log('📁 File info:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Store the logo filename in settings for reference
    const logoFilename = req.file.filename;
    
    // Save logo filename to settings table
    sequelize.query(`
      INSERT INTO settings (key, value, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = datetime('now')
    `, {
      replacements: ['current_logo', logoFilename]
    }).then(() => {
      console.log(`✅ Logo filename saved to settings: ${logoFilename}`);
    }).catch(err => {
      console.log('⚠️ Failed to save logo filename to settings:', err.message);
    });
    
    console.log(`✅ Logo uploaded successfully: ${logoFilename}`);
    
    res.status(200).json({ 
      message: 'Logo uploaded successfully',
      filename: logoFilename,
      path: req.file.path
    });
    
  } catch (error) {
    console.error('❌ Error in uploadLogo:', error);
    res.status(500).json({ 
      message: 'Failed to upload logo',
      error: error.message 
    });
  }
};

// Get a specific setting
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    console.log(`🔍 Fetching setting: ${key}`);
    
    const [results] = await sequelize.query(
      'SELECT * FROM settings WHERE key = ?',
      { replacements: [key] }
    );
    
    if (!results || results.length === 0) {
      console.log(`⚠️ Setting not found: ${key}`);
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    console.log(`✅ Setting found: ${key} = ${results[0].value}`);
    res.json({ key: results[0].key, value: results[0].value });
    
  } catch (err) {
    console.error(`❌ Error fetching setting ${req.params.key}:`, err);
    res.status(500).json({ 
      message: 'Failed to fetch setting',
      error: err.message 
    });
  }
};
