const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const settingsController = require('../controllers/settingsController');
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
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${timestamp}${ext}`);
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

// --- Routes ---
// Update the logo routes:
router.get('/', auth, settingsController.getSettings);
router.put('/', auth, checkRole(['admin']), settingsController.updateSettings);

// Logo routes - GET doesn't need auth for display, POST needs auth for upload
router.get('/logo', settingsController.getLogo); // ← Remove auth here for public access
router.post('/logo', auth, checkRole(['admin']), uploadLogo.single('logo'), settingsController.uploadLogo);

// Individual setting routes
router.get('/:key', auth, settingsController.getSetting);

module.exports = router;