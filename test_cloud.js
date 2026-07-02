require('dotenv').config();
const cloudinary = require('./server/config/cloudinary');
console.log(cloudinary.config());
