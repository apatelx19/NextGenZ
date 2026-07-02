require('dotenv').config();
const cloudinary = require('./server/config/cloudinary');
cloudinary.uploader.upload('package.json', function(error, result) {
  console.log('Error:', error);
  console.log('Result:', result);
});
