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
    console.log('🔍 GET /settings/logo - Searching for uploaded logo...');
    
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
    
    // ✅ FIX: Sort by file modification time, not alphabetically
    const latestLogo = logoFiles
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)[0].name; // Most recent first
    
    const logoPath = path.join(uploadsDir, latestLogo);
    
    console.log(`✅ Using latest logo: ${latestLogo}`);
    console.log(`✅ Full path: ${logoPath}`);
    
    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file does not exist at path');
      return res.status(404).json({ message: 'Logo file not found' });
    }
    
    // Set proper headers for image response
    const ext = path.extname(latestLogo).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the file using streaming for better error handling
    const fileStream = fs.createReadStream(logoPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('❌ Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading logo file' });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getLogo:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to fetch logo',
        error: error.message 
      });
    }
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

    // --- Archive old logo.jpg if it exists ---
    const uploadsDir = path.join(__dirname, '../uploads');
    const frontendLogoPath = path.join(__dirname, '../../frontend/public/logo.jpg');
    const oldLogoPath = path.join(uploadsDir, 'logo.jpg');
    if (fs.existsSync(oldLogoPath)) {
      const timestamp = Date.now();
      const archivePath = path.join(uploadsDir, `logo-archived-${timestamp}.jpg`);
      fs.renameSync(oldLogoPath, archivePath);
      console.log(`🗂️ Archived old logo.jpg to ${archivePath}`);
    }

    // --- Rename the new uploaded logo to logo.jpg in uploads ---
    const newLogoPath = path.join(uploadsDir, 'logo.jpg');
    fs.copyFileSync(req.file.path, newLogoPath);
    console.log('✅ Copied new logo to backend/uploads/logo.jpg');

    // --- Copy logo.jpg to frontend/public/logo.jpg ---
    try {
      fs.copyFileSync(newLogoPath, frontendLogoPath);
      console.log('✅ Copied logo to frontend/public/logo.jpg');
    } catch (copyErr) {
      console.error('❌ Failed to copy logo to frontend/public/logo.jpg:', copyErr);
    }

    // Save logo filename to settings table (always logo.jpg now)
    sequelize.query(`
      INSERT INTO settings (key, value, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = datetime('now')
    `, {
      replacements: ['current_logo', 'logo.jpg']
    }).then(() => {
      console.log('✅ Logo filename saved to settings: logo.jpg');
    }).catch(err => {
      console.log('⚠️ Failed to save logo filename to settings:', err.message);
    });

    console.log('✅ Logo uploaded and renamed to logo.jpg');

    res.status(200).json({ 
      message: 'Logo uploaded and renamed to logo.jpg',
      filename: 'logo.jpg',
      path: newLogoPath
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

// Add this new function after the uploadLogo function (around line 190):
exports.getAllLogos = (req, res) => {
  try {
    console.log('🔍 GET /settings/logos - Fetching all uploaded logos...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Uploads directory does not exist');
      return res.json([]);
    }
    
    const files = fs.readdirSync(uploadsDir);
    
    const logoFiles = files
      .filter(file => {
        const isLogo = file.toLowerCase().includes('logo') && 
                      (file.toLowerCase().endsWith('.jpg') || 
                       file.toLowerCase().endsWith('.jpeg') || 
                       file.toLowerCase().endsWith('.png'));
        return isLogo;
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          uploadDate: stats.mtime,
          size: stats.size,
          url: `/api/settings/logo/${file}` // Correct URL format
        };
      })
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()); // Most recent first
    
    console.log(`✅ Found ${logoFiles.length} logo files`);
    res.json(logoFiles);
    
  } catch (error) {
    console.error('❌ Error in getAllLogos:', error);
    res.status(500).json({ 
      message: 'Failed to fetch logo list',
      error: error.message 
    });
  }
};

// Add this function to serve specific logos by filename:
exports.getLogoByFilename = (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`🔍 GET /settings/logo/${filename} - Serving specific logo...`);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const logoPath = path.join(uploadsDir, filename);
    
    // Security check - ensure filename only contains valid characters
    if (!/^logo.*\.(jpg|jpeg|png)$/i.test(filename)) {
      console.log('❌ Invalid filename format');
      return res.status(400).json({ message: 'Invalid filename format' });
    }
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file does not exist');
      return res.status(404).json({ message: 'Logo file not found' });
    }
    
    // Set proper headers for image response
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Send the file
    const fileStream = fs.createReadStream(logoPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('❌ Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading logo file' });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getLogoByFilename:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to serve logo',
        error: error.message 
      });
    }
  }
};

// Add this function to set active logo:
exports.setActiveLogo = async (req, res) => {
  try {
    const { filename } = req.body;
    console.log(`🔍 Setting active logo to: ${filename}`);
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }
    
    // Verify the file exists
    const uploadsDir = path.join(__dirname, '../uploads');
    const logoPath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ message: 'Logo file not found' });
    }
    
    // Save the active logo filename to settings
    await sequelize.query(`
      INSERT INTO settings (key, value, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = datetime('now')
    `, {
      replacements: ['active_logo', filename]
    });
    
    console.log(`✅ Active logo set to: ${filename}`);
    res.json({ 
      message: 'Active logo updated successfully',
      filename: filename
    });
    
  } catch (error) {
    console.error('❌ Error in setActiveLogo:', error);
    res.status(500).json({ 
      message: 'Failed to set active logo',
      error: error.message 
    });
  }
};
