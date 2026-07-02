const axios = require('axios');
const crypto = require('crypto');
const Application = require('../models/Application');
const StatusLog = require('../models/StatusLog');
const emailService = require('../services/emailService');

exports.submitDirectApplication = async (req, res, next) => {
  try {
    const { email, phone, paymentId, transactionId } = req.body;
    const safeEmail = email ? String(email) : undefined;
    const safePhone = phone ? String(phone) : undefined;

    if (transactionId) {
      const existingTx = await Application.findOne({ transactionId });
      if (existingTx) {
        return res.status(400).json({ error: 'This Transaction ID has already been submitted. If you believe this is an error, please contact NextGenZ Tech Support.' });
      }
    }

    if (safeEmail || safePhone) {
      const existingApp = await Application.findOne({
        $or: [{ email: safeEmail }, { phone: safePhone }],
        status: { $ne: "Rejected" } 
      });
      if (existingApp) {
        return res.status(400).json({ error: 'An application with this email or phone number already exists.' });
      }
    }
    
    const applicationData = req.body;
    applicationData.status = 'Pending Payment Verification';
    
    const count = await Application.countDocuments();
    const currentYear = new Date().getFullYear();
    const paddedCount = String(count + 1).padStart(4, '0');
    applicationData.applicationId = `NGZ-${currentYear}-${paddedCount}`;
    
    applicationData.paymentRequestId = 'Manual-UPI';

    const newApplication = new Application(applicationData);
    
    newApplication.statusHistory.push({
      status: 'Pending Payment Verification',
      updatedBy: 'System',
      remarks: 'Application submitted with UPI UTR: ' + transactionId
    });
    
    await newApplication.save();

    await StatusLog.create({
      adminName: 'System',
      applicationId: newApplication.applicationId,
      applicationMongoId: newApplication._id,
      oldStatus: 'None',
      newStatus: 'Pending Payment Verification',
      remarks: 'Application submitted with UPI UTR: ' + transactionId
    });
    
    // Send Emails asynchronously
    emailService.sendApplicationSuccessEmail(newApplication);
    emailService.sendAdminNotificationEmail(newApplication);
    
    res.status(200).json({ success: true, message: 'Application submitted successfully.' });

  } catch (error) {
    console.error('Submit Application Error:', error.message);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
};


