const logger = require('../utils/logger');
const path = require('path');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (process.env.NODE_ENV !== 'production') {
      logger.error(err.stack);
  }

  // Handle specific errors if needed
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload passed.' });
  }

  // Generic fallback message
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.status || 500).json({ 
      success: false, 
      message: 'Something went wrong. Please try again later.' 
    });
  } else {
    return res.status(err.status || 500).sendFile(path.join(__dirname, '../../client/website/500.html'));
  }
};

module.exports = errorHandler;
