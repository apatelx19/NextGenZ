const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// POST /api/track
// Public route to track application status
router.post('/', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'Email and phone number are required.' });
    }

    // Helper to normalize Gmail addresses for loose tracking match (Gmail ignores dots and plus addressing)
    const normalizeEmail = (emailStr) => {
      if (!emailStr) return '';
      const parts = emailStr.trim().toLowerCase().split('@');
      if (parts.length !== 2) return emailStr.toLowerCase();
      
      let [local, domain] = parts;
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        local = local.replace(/\./g, '').split('+')[0];
      }
      return `${local}@${domain}`;
    };

    const normalizedInputEmail = normalizeEmail(email);

    // Find all applications matching the phone number
    const applications = await Application.find({ phone: phone });

    // Find the application where the normalized email matches the input
    const application = applications.find(app => normalizeEmail(app.email) === normalizedInputEmail);

    if (!application) {
      return res.status(404).json({ success: false, message: 'No application found with these details.' });
    }

    // Only return safe, non-sensitive data needed for tracking
    const safeData = {
      fullName: application.fullName,
      domain: application.domain,
      status: application.status,
      paymentId: application.paymentId,
      createdAt: application.createdAt
    };

    res.json({ success: true, application: safeData });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ success: false, message: 'Server error tracking application' });
  }
});

module.exports = router;
