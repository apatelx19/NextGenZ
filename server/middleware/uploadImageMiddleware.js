const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'NextGenZ-Tech/Profiles', // Folder inside Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'] // Only accept images
  }
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext) && file.mimetype.startsWith('image/')) {
    file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG image files are allowed.'), false);
  }
};

const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit for images
  }
});

module.exports = uploadImage;
