const axios = require('axios');
const crypto = require('crypto');
const Application = require('../models/Application');
const StatusLog = require('../models/StatusLog');
const emailService = require('../services/emailService');

exports.submitDirectApplication = async (req, res, next) => {
  try {
    // Verify Cloudflare Turnstile token if configured
    if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      const { turnstileToken } = req.body;
      if (!turnstileToken) {
        return res.status(400).json({ error: 'Security verification (bot protection) is required.' });
      }
      try {
        const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const verifyRes = await axios.post(verifyUrl, new URLSearchParams({
          secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: req.ip
        }));
        if (!verifyRes.data.success) {
          return res.status(400).json({ error: 'Security verification failed. Please refresh and try again.' });
        }
      } catch (err) {
        console.error('Turnstile verification error:', err);
        return res.status(500).json({ error: 'Failed to verify bot protection. Please try again.' });
      }
    }

    const { 
      email, 
      phone, 
      plan,
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    const safeEmail = email ? String(email) : undefined;
    const safePhone = phone ? String(phone) : undefined;

    // Handle Free Foundation Batch plan
    if (plan === 'Free') {
      const freeSeatsCount = await Application.countDocuments({ plan: 'Free', status: { $ne: 'Rejected' } });
      if (freeSeatsCount >= 30) {
        return res.status(400).json({ error: 'Sorry! All 30 free seats for the Foundation Batch have already been claimed.' });
      }

      // Populate dummy payment details for free plan
      const uniqueId = crypto.randomBytes(6).toString('hex').toUpperCase();
      req.body.razorpay_payment_id = `FREE-${uniqueId}`;
      req.body.razorpay_order_id = 'FREE_ORDER';
      req.body.razorpay_signature = 'FREE_SIGNATURE';
    } else {
      // Check if this payment ID has already been used to prevent duplicate applications
      const existingPayment = await Application.findOne({ paymentId: razorpay_payment_id });
      if (existingPayment) {
        return res.status(400).json({ error: 'This payment has already been used for an application.' });
      }

      // Verify the Razorpay payment signature
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: 'Payment gateway configuration error.' });
      }
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
        
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed. Please contact support.' });
      }
    }

    const applicationData = req.body;
    
    // Automate payment verification status updates
    applicationData.status = 'Verified';
    applicationData.paymentId = req.body.razorpay_payment_id;
    applicationData.transactionId = req.body.razorpay_payment_id;
    applicationData.paymentRequestId = req.body.razorpay_order_id;
    applicationData.verifiedBy = plan === 'Free' ? 'System (Free Plan)' : 'Razorpay';
    applicationData.verificationDate = Date.now();
    
    // Find the latest application by sorting to get the highest serial number
    const latestApp = await Application.findOne({}, { applicationId: 1 })
      .sort({ createdAt: -1 })
      .exec();
    
    let nextNum = 1;
    if (latestApp && latestApp.applicationId) {
      const match = latestApp.applicationId.match(/NGZ-\d+-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const currentYear = new Date().getFullYear();
    const paddedCount = String(nextNum).padStart(4, '0');
    applicationData.applicationId = `NGZ-${currentYear}-${paddedCount}`;
    
    const newApplication = new Application(applicationData);
    
    newApplication.statusHistory.push({
      status: 'Verified',
      updatedBy: 'Razorpay',
      remarks: 'Payment automatically verified via Razorpay'
    });
    
    await newApplication.save();

    await StatusLog.create({
      adminName: 'Razorpay',
      applicationId: newApplication.applicationId,
      applicationMongoId: newApplication._id,
      oldStatus: 'None',
      newStatus: 'Verified',
      remarks: 'Payment automatically verified via Razorpay'
    });
    
    // Send Emails asynchronously
    emailService.sendApplicationSuccessEmail(newApplication);
    emailService.sendStatusEmail(newApplication);
    emailService.sendAdminNotificationEmail(newApplication);
    
    res.status(200).json({ success: true, message: 'Application submitted successfully.' });

  } catch (error) {
    console.error('Submit Application Error:', error.message);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
};

exports.getFoundationSeats = async (req, res, next) => {
  try {
    const count = await Application.countDocuments({ plan: 'Free', status: { $ne: 'Rejected' } });
    res.status(200).json({
      claimed: count,
      total: 30,
      available: Math.max(0, 30 - count)
    });
  } catch (error) {
    console.error('Get Foundation Seats Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve seat availability.' });
  }
};


