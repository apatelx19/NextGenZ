const { body, validationResult } = require('express-validator');

// Validation logic for application form
exports.validateApplication = [
  body('fullName').trim().notEmpty().withMessage('Full Name is required').escape(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number'),
  body('college').trim().notEmpty().withMessage('College is required').escape(),
  body('course').trim().notEmpty().withMessage('Course is required').escape(),
  body('year').trim().notEmpty().withMessage('Year is required').escape(),
  body('domain').trim().notEmpty().withMessage('Domain is required').escape(),
  body('linkedin').optional({ checkFalsy: true }).isURL().withMessage('Valid LinkedIn URL is required'),
  body('github').optional({ checkFalsy: true }).isURL().withMessage('Valid GitHub URL is required'),
  body('whyJoin').trim().notEmpty().withMessage('Reason to join is required').escape(),
  body('razorpay_payment_id').if((value, { req }) => req.body.plan !== 'Free').trim().notEmpty().withMessage('Razorpay Payment ID is required'),
  body('razorpay_order_id').if((value, { req }) => req.body.plan !== 'Free').trim().notEmpty().withMessage('Razorpay Order ID is required'),
  body('razorpay_signature').if((value, { req }) => req.body.plan !== 'Free').trim().notEmpty().withMessage('Razorpay Signature is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), error: errors.array()[0].msg });
    }
    next();
  }
];

// Validation logic for Admin Login
exports.validateAdminLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), error: errors.array()[0].msg });
    }
    next();
  }
];
