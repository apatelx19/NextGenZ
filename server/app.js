const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const trackRoutes = require('./routes/trackRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Logging Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Performance Middleware
app.use(compression());

// Security Middleware
// Use Helmet for secure HTTP headers, strictly protecting against XSS, clickjacking, MIME type sniffing, etc.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://api.cloudinary.com"], // added typical connect endpoints for payments/uploads just in case
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"]
    }
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // allows Razorpay popup
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows Cloudinary/CDN images
  crossOriginEmbedderPolicy: false, // Often breaks external iframes/images if enabled strictly
  referrerPolicy: { policy: 'no-referrer' }
}));

// Manual Permissions-Policy since Helmet might not fully support it out-of-the-box depending on version
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// CORS strictly limited to production domain and local dev
const allowedOrigins = [
  'https://nextgenztech.online',
  'https://www.nextgenztech.online',
  'https://nextgenz.onrender.com',
  'https://nextgenztech.com',
  'http://localhost:3000'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
app.use(cookieParser());
// Rate Limiting Config
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { success: false, message: 'Too many payment requests, please try again after 15 minutes' }
});

const uploadResumeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many resume uploads, please try again after 15 minutes' }
});

const uploadScreenshotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many screenshot uploads, please try again after 15 minutes' }
});

// Apply global rate limiter
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/create-razorpay-order', paymentLimiter);
app.use('/api/verify-payment', paymentLimiter);
app.use('/api/upload-resume', uploadResumeLimiter);
app.use('/api/upload-payment-screenshot', uploadScreenshotLimiter);

// Static Files - Serve client/website, client/admin, and client/assets
// Using 1-day caching in production
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
};
app.use(express.static(path.join(__dirname, '../client/website'), staticOptions));

// Protect dashboard from unauthenticated access
const jwt = require('jsonwebtoken');
app.use('/admin/dashboard.html', (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) {
    return res.redirect('/admin/index.html');
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.redirect('/admin/index.html');
  }
});

app.use('/admin', express.static(path.join(__dirname, '../client/admin'), staticOptions));
app.use('/assets', express.static(path.join(__dirname, '../client/website/assets'), staticOptions));

// API Routes
const { doubleCsrfProtection } = require('./middleware/csrf');

app.use('/api/auth', authRoutes);

// Apply CSRF to all /api/admin routes
app.use('/api/admin', doubleCsrfProtection);

app.use('/api/admin/export', exportRoutes); // More specific route first
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin', statusRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', uploadRoutes); // Contains /api/upload-resume
app.use('/api', applicationRoutes); // For public application routes
app.use('/api', reviewRoutes); // Public and Admin Review routes

// Health Check Endpoint for Monitoring
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const statusCode = dbStatus === 'connected' ? 200 : 503;
  const memoryUsage = process.memoryUsage();
  
  res.status(statusCode).json({
    status: dbStatus === 'connected' ? 'ok' : 'error',
    server: 'running',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    memoryUsage: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  });
});

// API 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});


// Staging test route for 500 error page
if (process.env.NODE_ENV !== 'production') {
  app.get('/test-500', (req, res, next) => {
    next(new Error('This is a simulated 500 error for testing purposes.'));
  });
}

// SPA Fallback for client/website/index.html
app.get('*', (req, res) => {
  // If it looks like a static asset, return 404 instead of index.html
  if (req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|pdf|json|xml|map)$/)) {
    return res.status(404).sendFile(path.join(__dirname, '../client/website/404.html'));
  }
  res.sendFile(path.join(__dirname, '../client/website/index.html'));
});

// Centralized Error Handling Middleware (must be added after all routes)
app.use(errorHandler);

module.exports = app;
