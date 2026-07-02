const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'NextGenZ-Tech/PaymentScreenshots',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, or WEBP files are allowed.'), false);
  }
};

const uploadScreenshot = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

module.exports = uploadScreenshot;
