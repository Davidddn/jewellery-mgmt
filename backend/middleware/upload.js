const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/', // Make sure this directory exists or is created
    filename: function(req, file, cb){
        if (file.fieldname === 'logo') {
            cb(null, 'logo.jpg');
        } else {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }
});

// Check file type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|csv|xlsx/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images, CSVs, and XLSX files Only!');
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits:{fileSize: 10000000}, // 10MB limit
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
});

module.exports = upload;
