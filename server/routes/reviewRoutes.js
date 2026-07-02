const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImageMiddleware');
const { body, validationResult } = require('express-validator');

// Validation Rules
const validateReview = [
    body('fullName').notEmpty().withMessage('Full Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('domain').notEmpty().withMessage('Domain is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').isLength({ min: 20, max: 500 }).withMessage('Review must be between 20 and 500 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

// Public Routes
router.post('/reviews', uploadImage.single('profileImage'), validateReview, reviewController.submitReview);
router.get('/reviews', reviewController.getApprovedReviews);

// Admin Routes (Protected)
router.get('/admin/reviews', auth, reviewController.getAllReviews);
router.put('/admin/reviews/:id/approve', auth, reviewController.approveReview);
router.put('/admin/reviews/:id/reject', auth, reviewController.rejectReview);
router.delete('/admin/reviews/:id', auth, reviewController.deleteReview);

module.exports = router;
