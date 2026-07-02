const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'NextGenZ-Tech/Resumes', // Folder inside Cloudinary
    resource_type: 'raw' // Essential for PDF files
  }
});

const fileFilter = (req, file, cb) => {
  // Extra security: verify extension directly
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (file.mimetype === 'application/pdf' && ext === 'pdf') {
    // Sanitize filename
    file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed. No other formats or disguised files.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  }
});

module.exports = upload;
