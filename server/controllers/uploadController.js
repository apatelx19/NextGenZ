exports.uploadResume = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or invalid file type. Only PDF allowed.' });
    }

    res.status(200).json({
      success: true,
      fileUrl: req.file.path,
      publicId: req.file.filename // For multer-storage-cloudinary, public_id is saved in filename
    });
  } catch (error) {
    console.error('Error in upload controller:', error);
    res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};

exports.uploadPaymentScreenshot = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No screenshot uploaded or invalid file type.' });
    }

    res.status(200).json({
      success: true,
      fileUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Error in uploadPaymentScreenshot controller:', error);
    res.status(500).json({ success: false, message: 'Screenshot upload failed.' });
  }
};
