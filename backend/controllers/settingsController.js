const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Overwrite existing logo with the same name
    const ext = path.extname(file.originalname);
    const filename = 'logo' + ext;

    // Delete old logo if it exists with a different extension
    const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
    extensions.forEach(oldExt => {
        if (oldExt !== ext) {
            const oldLogoPath = path.join(UPLOAD_DIR, 'logo' + oldExt);
            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }
    });

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: File upload only supports the following filetypes - ' + allowedTypes);
  },
}).single('logo');

exports.uploadLogo = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file selected' });
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: fullUrl,
    });
  });
};

exports.getLogo = (req, res) => {
    const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
    let foundLogoPath = null;
    for (const ext of extensions) {
        const potentialLogoPath = path.join(UPLOAD_DIR, 'logo' + ext);
        if (fs.existsSync(potentialLogoPath)) {
            foundLogoPath = `/uploads/logo${ext}`;
            break;
        }
    }
    if (foundLogoPath) {
        const fullUrl = `${req.protocol}://${req.get('host')}${foundLogoPath}`;
        res.json({ success: true, logoUrl: fullUrl });
    } else {
        res.json({ success: false, logoUrl: null });
    }
};