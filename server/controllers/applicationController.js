const axios = require('axios');
const crypto = require('crypto');
const Application = require('../models/Application');
const StatusLog = require('../models/StatusLog');
const emailService = require('../services/emailService');

exports.submitDirectApplication = async (req, res, next) => {
  try {
    const { 
      email, 
      phone, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    const safeEmail = email ? String(email) : undefined;
    const safePhone = phone ? String(phone) : undefined;

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

    const applicationData = req.body;
    
    // Automate payment verification status updates
    applicationData.status = 'Verified';
    applicationData.paymentId = razorpay_payment_id;
    applicationData.transactionId = razorpay_payment_id;
    applicationData.paymentRequestId = razorpay_order_id;
    applicationData.verifiedBy = 'Razorpay';
    applicationData.verificationDate = Date.now();
    
    const count = await Application.countDocuments();
    const currentYear = new Date().getFullYear();
    const paddedCount = String(count + 1).padStart(4, '0');
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


