const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '../../.env' }); // Adjust path based on where it's used

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 15000
});

module.exports = cloudinary;
