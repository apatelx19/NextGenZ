const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// Define route for handling file upload
// We capture multer errors directly in the route handler so we can return proper JSON
router.post('/upload-resume', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      // Handle Multer errors (like file size or file type)
      if (err.message === 'Only PDF files are allowed.') {
        return res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Maximum file size is 5MB.' });
      }
      console.error('Multer Upload Error:', err);
      return res.status(500).json({ success: false, message: `An error occurred during file upload: ${err.message || err}` });
    }
    // If no error, proceed to controller
    next();
  });
}, uploadController.uploadResume);

const uploadScreenshot = require('../middleware/uploadScreenshotMiddleware');

router.post('/upload-payment-screenshot', (req, res, next) => {
  uploadScreenshot.single('paymentScreenshot')(req, res, (err) => {
    if (err) {
      if (err.message.includes('Only PNG')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Maximum file size is 5MB.' });
      }
      console.error('Multer Upload Error (Screenshot):', err);
      return res.status(500).json({ success: false, message: `An error occurred during file upload: ${err.message || err}` });
    }
    next();
  });
}, uploadController.uploadPaymentScreenshot);

module.exports = router;
