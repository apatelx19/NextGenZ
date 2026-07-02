const Review = require('../models/Review');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Ensure your Gmail or SMTP is configured
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Public
exports.submitReview = async (req, res, next) => {
    try {
        const { fullName, email, domain, rating, review } = req.body;
        
        let profileImage = { url: '', publicId: '' };
        if (req.file) {
            profileImage.url = req.file.path;
            profileImage.publicId = req.file.filename;
        }

        const newReview = new Review({
            fullName,
            email,
            domain,
            rating: Number(rating),
            review,
            profileImage
        });

        await newReview.save();

        // Send Email Notification to Admin
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: 'New Review Submitted - Awaiting Approval',
            html: `
                <h3>New Review Submitted</h3>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Domain:</strong> ${domain}</p>
                <p><strong>Rating:</strong> ${rating} Stars</p>
                <p><strong>Review:</strong> ${review}</p>
                <p>Please log in to the admin dashboard to approve or reject this review.</p>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.error("Email Error:", error);
            });
        }

        res.status(201).json({ success: true, message: 'Review submitted successfully. Awaiting approval.' });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/reviews
// @desc    Get all approved reviews for public website
// @access  Public
exports.getApprovedReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/reviews
// @desc    Get all reviews for admin dashboard
// @access  Private (Admin)
exports.getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/reviews/:id/approve
// @desc    Approve a review
// @access  Private (Admin)
exports.approveReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        res.status(200).json({ success: true, message: 'Review approved successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/reviews/:id/reject
// @desc    Reject a review
// @access  Private (Admin)
exports.rejectReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        res.status(200).json({ success: true, message: 'Review rejected successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete a review
// @access  Private (Admin)
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        next(error);
    }
};
