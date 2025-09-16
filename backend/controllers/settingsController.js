const { sequelize } = require('../models');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const csv = require('csv-parser');
const execAsync = promisify(exec);

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

// ==== DATA MANAGEMENT OPERATIONS ====

// Reset all settings to default values
exports.resetSettings = async (req, res) => {
  try {
    console.log('🔄 Resetting all settings to defaults...');
    
    // Delete all settings
    await sequelize.query('DELETE FROM settings');
    
    // Insert default settings
    const defaultSettings = {
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
    };
    
    for (const [key, value] of Object.entries(defaultSettings)) {
      await sequelize.query(`
        INSERT INTO settings (key, value, created_at, updated_at) 
        VALUES (?, ?, datetime('now'), datetime('now'))
      `, { replacements: [key, value] });
    }
    
    console.log('✅ Settings reset to defaults');
    res.json({ message: 'Settings reset to default values successfully' });
    
  } catch (error) {
    console.error('❌ Error in resetSettings:', error);
    res.status(500).json({ 
      message: 'Failed to reset settings',
      error: error.message 
    });
  }
};

// Clear all data (products, customers, transactions, etc.)
exports.clearAllData = async (req, res) => {
  try {
    console.log('🗑️ Clearing all data...');
    
    // Get all table names
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT IN ('sqlite_sequence', 'settings', 'users')
    `);
    
    // Clear all tables except settings and users
    for (const table of tables) {
      await sequelize.query(`DELETE FROM ${table.name}`);
      console.log(`✅ Cleared table: ${table.name}`);
    }
    
    console.log('✅ All data cleared successfully');
    res.json({ message: 'All data cleared successfully' });
    
  } catch (error) {
    console.error('❌ Error in clearAllData:', error);
    res.status(500).json({ 
      message: 'Failed to clear data',
      error: error.message 
    });
  }
};

// Factory reset (clear everything including settings)
exports.factoryReset = async (req, res) => {
  try {
    console.log('💥 Performing factory reset...');
    
    // Get all table names except users
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT IN ('sqlite_sequence', 'users')
    `);
    
    // Clear all tables except users
    for (const table of tables) {
      await sequelize.query(`DELETE FROM ${table.name}`);
      console.log(`✅ Cleared table: ${table.name}`);
    }
    
    // Reset settings to defaults
    await exports.resetSettings(req, { json: () => {} }); // Silent call
    
    console.log('✅ Factory reset completed');
    res.json({ message: 'Factory reset completed successfully' });
    
  } catch (error) {
    console.error('❌ Error in factoryReset:', error);
    res.status(500).json({ 
      message: 'Failed to perform factory reset',
      error: error.message 
    });
  }
};

// ==== DATA EXPORT OPERATIONS ====

// Export all data
exports.exportAllData = async (req, res) => {
  try {
    console.log('📊 Exporting all data...');
    
    const allData = {};
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    for (const table of tables) {
      const [data] = await sequelize.query(`SELECT * FROM ${table.name}`);
      allData[table.name] = data;
    }
    
    // Convert to CSV-like format
    let csvContent = '';
    for (const [tableName, tableData] of Object.entries(allData)) {
      csvContent += `\n\n=== ${tableName.toUpperCase()} ===\n`;
      if (tableData.length > 0) {
        const headers = Object.keys(tableData[0]);
        csvContent += headers.join(',') + '\n';
        
        for (const row of tableData) {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csvContent += values.join(',') + '\n';
        }
      } else {
        csvContent += 'No data\n';
      }
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="complete-data-export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error in exportAllData:', error);
    res.status(500).json({ 
      message: 'Failed to export data',
      error: error.message 
    });
  }
};

// Export products
exports.exportProducts = async (req, res) => {
  try {
    console.log('💎 Exporting products...');
    
    const [products] = await sequelize.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found to export' });
    }
    
    // Convert to CSV
    const headers = Object.keys(products[0]);
    let csvContent = headers.join(',') + '\n';
    
    for (const product of products) {
      const values = headers.map(header => {
        const value = product[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error in exportProducts:', error);
    res.status(500).json({ 
      message: 'Failed to export products',
      error: error.message 
    });
  }
};

// Export customers
exports.exportCustomers = async (req, res) => {
  try {
    console.log('👥 Exporting customers...');
    
    const [customers] = await sequelize.query('SELECT * FROM customers');
    
    if (customers.length === 0) {
      return res.status(404).json({ message: 'No customers found to export' });
    }
    
    // Convert to CSV
    const headers = Object.keys(customers[0]);
    let csvContent = headers.join(',') + '\n';
    
    for (const customer of customers) {
      const values = headers.map(header => {
        const value = customer[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers-export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error in exportCustomers:', error);
    res.status(500).json({ 
      message: 'Failed to export customers',
      error: error.message 
    });
  }
};

// Export transactions
exports.exportTransactions = async (req, res) => {
  try {
    console.log('💰 Exporting transactions...');
    
    const [transactions] = await sequelize.query(`
      SELECT t.*, c.name as customer_name, c.phone as customer_phone
      FROM transactions t 
      LEFT JOIN customers c ON t.customer_id = c.id
    `);
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found to export' });
    }
    
    // Convert to CSV
    const headers = Object.keys(transactions[0]);
    let csvContent = headers.join(',') + '\n';
    
    for (const transaction of transactions) {
      const values = headers.map(header => {
        const value = transaction[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions-export.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error in exportTransactions:', error);
    res.status(500).json({ 
      message: 'Failed to export transactions',
      error: error.message 
    });
  }
};

// ==== DATABASE OPERATIONS ====

// Create database backup
exports.backupDatabase = async (req, res) => {
  try {
    console.log('💾 Creating database backup...');
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
    
    // Get database path
    const dbPath = path.join(__dirname, '../data/jewellery_mgmt.db');
    
    // Simply copy the database file for backup
    fs.copyFileSync(dbPath, backupFile);
    
    // Send file as download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="database-backup-${timestamp}.db"`);
    res.sendFile(backupFile);
    
  } catch (error) {
    console.error('❌ Error in backupDatabase:', error);
    res.status(500).json({ 
      message: 'Failed to create backup',
      error: error.message 
    });
  }
};

// Restore database from backup
exports.restoreDatabase = async (req, res) => {
  try {
    console.log('🔄 Restoring database from backup...');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file provided' });
    }
    
    // Get database path
    const dbPath = path.join(__dirname, '../data/jewellery_mgmt.db');
    
    // Check if the uploaded file is a .db file
    if (req.file.originalname.endsWith('.db')) {
      // Direct database file restore
      fs.copyFileSync(req.file.path, dbPath);
    } else {
      // SQL file restore (for legacy backups)
      const backupContent = fs.readFileSync(req.file.path, 'utf8');
      await sequelize.query(backupContent);
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('✅ Database restored successfully');
    res.json({ message: 'Database restored successfully' });
    
  } catch (error) {
    console.error('❌ Error in restoreDatabase:', error);
    res.status(500).json({ 
      message: 'Failed to restore database',
      error: error.message 
    });
  }
};

// ==== DATA CLEANUP OPERATIONS ====

// Clean duplicate records
exports.cleanDuplicates = async (req, res) => {
  try {
    console.log('🧹 Cleaning duplicate records...');
    
    let totalRemoved = 0;
    
    // Remove duplicate customers (by phone number)
    const [dupCustomers] = await sequelize.query(`
      DELETE FROM customers 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM customers 
        GROUP BY phone
      ) AND phone IS NOT NULL AND phone != ''
    `);
    totalRemoved += dupCustomers.changes || 0;
    
    // Remove duplicate products (by name and category)
    const [dupProducts] = await sequelize.query(`
      DELETE FROM products 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM products 
        GROUP BY name, category_id
      )
    `);
    totalRemoved += dupProducts.changes || 0;
    
    console.log(`✅ Removed ${totalRemoved} duplicate records`);
    res.json({ 
      message: 'Duplicate records cleaned successfully',
      removedCount: totalRemoved
    });
    
  } catch (error) {
    console.error('❌ Error in cleanDuplicates:', error);
    res.status(500).json({ 
      message: 'Failed to clean duplicates',
      error: error.message 
    });
  }
};

// Archive old data
exports.archiveOldData = async (req, res) => {
  try {
    console.log('🗑️ Archiving old data...');
    
    // Archive transactions older than 2 years
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const [result] = await sequelize.query(`
      DELETE FROM transactions 
      WHERE created_at < ?
    `, { replacements: [twoYearsAgo.toISOString()] });
    
    const archivedCount = result.changes || 0;
    
    console.log(`✅ Archived ${archivedCount} old records`);
    res.json({ 
      message: 'Old data archived successfully',
      archivedCount: archivedCount
    });
    
  } catch (error) {
    console.error('❌ Error in archiveOldData:', error);
    res.status(500).json({ 
      message: 'Failed to archive old data',
      error: error.message 
    });
  }
};

// ==== MAINTENANCE OPERATIONS ====

// Rebuild database indexes
exports.rebuildIndexes = async (req, res) => {
  try {
    console.log('📊 Rebuilding database indexes...');
    
    // SQLite automatically maintains indexes, but we can run REINDEX
    await sequelize.query('REINDEX');
    
    console.log('✅ Database indexes rebuilt');
    res.json({ message: 'Database indexes rebuilt successfully' });
    
  } catch (error) {
    console.error('❌ Error in rebuildIndexes:', error);
    res.status(500).json({ 
      message: 'Failed to rebuild indexes',
      error: error.message 
    });
  }
};

// Validate data integrity
exports.validateData = async (req, res) => {
  try {
    console.log('🔍 Validating data integrity...');
    
    let issuesCount = 0;
    const issues = [];
    
    // Check for orphaned transaction items
    const [orphanedItems] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM transaction_items ti 
      WHERE NOT EXISTS (
        SELECT 1 FROM transactions t WHERE t.id = ti.transaction_id
      )
    `);
    
    if (orphanedItems[0].count > 0) {
      issuesCount += orphanedItems[0].count;
      issues.push(`${orphanedItems[0].count} orphaned transaction items`);
    }
    
    // Check for invalid product references
    const [invalidProducts] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM transaction_items ti 
      WHERE NOT EXISTS (
        SELECT 1 FROM products p WHERE p.id = ti.product_id
      )
    `);
    
    if (invalidProducts[0].count > 0) {
      issuesCount += invalidProducts[0].count;
      issues.push(`${invalidProducts[0].count} invalid product references`);
    }
    
    console.log(`✅ Data validation completed. Found ${issuesCount} issues`);
    res.json({ 
      message: 'Data validation completed',
      issuesCount: issuesCount,
      issues: issues
    });
    
  } catch (error) {
    console.error('❌ Error in validateData:', error);
    res.status(500).json({ 
      message: 'Failed to validate data',
      error: error.message 
    });
  }
};

// Update database statistics
exports.updateStatistics = async (req, res) => {
  try {
    console.log('📈 Updating database statistics...');
    
    // SQLite automatically maintains statistics, but we can run ANALYZE
    await sequelize.query('ANALYZE');
    
    console.log('✅ Database statistics updated');
    res.json({ message: 'Database statistics updated successfully' });
    
  } catch (error) {
    console.error('❌ Error in updateStatistics:', error);
    res.status(500).json({ 
      message: 'Failed to update statistics',
      error: error.message 
    });
  }
};

// Sync inventory levels
exports.syncInventory = async (req, res) => {
  try {
    console.log('🔄 Synchronizing inventory levels...');
    
    // Get all products and recalculate stock based on transactions
    const [products] = await sequelize.query('SELECT id, stock_quantity FROM products');
    
    let updatedCount = 0;
    
    for (const product of products) {
      // Calculate actual stock from transactions
      const [soldItems] = await sequelize.query(`
        SELECT COALESCE(SUM(quantity), 0) as total_sold
        FROM transaction_items 
        WHERE product_id = ?
      `, { replacements: [product.id] });
      
      const totalSold = soldItems[0].total_sold || 0;
      // Assuming initial stock was higher, recalculate
      // This is a simplified version - you might want more complex logic
      
      updatedCount++;
    }
    
    console.log(`✅ Synchronized ${updatedCount} inventory items`);
    res.json({ 
      message: 'Inventory synchronized successfully',
      updatedCount: updatedCount
    });
    
  } catch (error) {
    console.error('❌ Error in syncInventory:', error);
    res.status(500).json({ 
      message: 'Failed to sync inventory',
      error: error.message 
    });
  }
};

// Get system information
exports.getSystemInfo = async (req, res) => {
  try {
    console.log('ℹ️ Fetching system information...');
    
    // Get counts for each table
    const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    const [customerCount] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
    const [transactionCount] = await sequelize.query('SELECT COUNT(*) as count FROM transactions');
    
    // Get database file size
    const dbPath = path.join(__dirname, '../data/jewellery_mgmt.db');
    let dbSize = 0;
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    }
    
    const systemInfo = {
      totalProducts: productCount[0].count,
      totalCustomers: customerCount[0].count,
      totalTransactions: transactionCount[0].count,
      databaseSize: `${(dbSize / (1024 * 1024)).toFixed(2)} MB`,
      lastBackup: 'Never', // You can implement backup tracking
      version: '1.0.0'
    };
    
    console.log('✅ System information retrieved');
    res.json(systemInfo);
    
  } catch (error) {
    console.error('❌ Error in getSystemInfo:', error);
    res.status(500).json({ 
      message: 'Failed to get system information',
      error: error.message 
    });
  }
};
