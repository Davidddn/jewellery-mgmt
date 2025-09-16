const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const settingsController = require('../controllers/settingsController');
const importController = require('../controllers/importController');
const { protect: auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// --- Multer Storage for Logo (Keep timestamp naming) ---
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../uploads');
    // Ensure the directory exists
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Keep timestamp to track upload history and avoid conflicts
    cb(null, `logo.jpg`);
  },
});

const uploadLogo = multer({ 
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// --- Multer Storage for Backup Files ---
const backupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../temp');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, `restore-${Date.now()}-${file.originalname}`);
  },
});

const uploadBackup = multer({ 
  storage: backupStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for backups
  },
  fileFilter: (req, file, cb) => {
    // Check file type for SQL backups and CSV files
    if (file.mimetype === 'application/sql' || 
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/csv' ||
        file.originalname.endsWith('.sql') || 
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.backup') ||
        file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only SQL backup files, CSV files, or database files are allowed'), false);
    }
  }
});

// --- Basic Routes ---
router.get('/', auth, settingsController.getSettings);
router.put('/', auth, checkRole(['admin']), settingsController.updateSettings);

// --- Logo Routes ---
router.get('/logo', settingsController.getLogo); // Current active logo
router.get('/logos', settingsController.getAllLogos); // List all logos
router.get('/logo/:filename', settingsController.getLogoByFilename); // Specific logo by filename
router.post('/logo', auth, checkRole(['admin']), uploadLogo.single('logo'), settingsController.uploadLogo);
router.put('/logo/active', auth, checkRole(['admin']), settingsController.setActiveLogo); // Set active logo

// --- Data Management Routes (Admin Only) ---
router.post('/reset', auth, checkRole(['admin']), settingsController.resetSettings);
router.delete('/clear-all-data', auth, checkRole(['admin']), settingsController.clearAllData);
router.post('/factory-reset', auth, checkRole(['admin']), settingsController.factoryReset);

// --- Data Export Routes ---
router.get('/export/all', auth, checkRole(['admin']), settingsController.exportAllData);
router.get('/export/products', auth, checkRole(['admin']), settingsController.exportProducts);
router.get('/export/customers', auth, checkRole(['admin']), settingsController.exportCustomers);
router.get('/export/transactions', auth, checkRole(['admin']), settingsController.exportTransactions);

// --- Data Import Routes ---
router.post('/import/products', auth, checkRole(['admin']), uploadBackup.single('file'), importController.importProducts);
router.post('/import/customers', auth, checkRole(['admin']), uploadBackup.single('file'), importController.importCustomers);
router.post('/import/transactions', auth, checkRole(['admin']), uploadBackup.single('file'), importController.importTransactions);
// router.post('/import/customers', auth, checkRole(['admin']), uploadBackup.single('file'), settingsController.importCustomers);
// router.post('/import/transactions', auth, checkRole(['admin']), uploadBackup.single('file'), settingsController.importTransactions);

// --- Database Operations ---
router.post('/backup', auth, checkRole(['admin']), settingsController.backupDatabase);
router.post('/restore', auth, checkRole(['admin']), uploadBackup.single('backup'), settingsController.restoreDatabase);

// --- Data Cleanup Routes ---
router.post('/cleanup/duplicates', auth, checkRole(['admin']), settingsController.cleanDuplicates);
router.post('/cleanup/archive', auth, checkRole(['admin']), settingsController.archiveOldData);

// --- Maintenance Routes ---
router.post('/maintenance/rebuild-indexes', auth, checkRole(['admin']), settingsController.rebuildIndexes);
router.post('/maintenance/validate-data', auth, checkRole(['admin']), settingsController.validateData);
router.post('/maintenance/update-stats', auth, checkRole(['admin']), settingsController.updateStatistics);
router.post('/maintenance/sync-inventory', auth, checkRole(['admin']), settingsController.syncInventory);

// --- System Information ---
router.get('/system-info', auth, checkRole(['admin']), settingsController.getSystemInfo);

// Individual setting routes
router.get('/:key', auth, settingsController.getSetting);

module.exports = router;