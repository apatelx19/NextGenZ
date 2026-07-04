const Application = require('../models/Application');
const StatusLog = require('../models/StatusLog');
const emailService = require('../services/emailService');

// PUT /api/admin/application/:id/status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    // Assuming req.admin contains the logged in admin details from auth middleware
    const adminName = req.admin ? req.admin.username : 'Admin'; 

    const allowedStatuses = ['Pending Payment Verification', 'Verified', 'Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Completed'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const oldStatus = application.status;
    if (oldStatus === status) {
      return res.status(400).json({ success: false, message: 'Application is already in this status' });
    }

    application.status = status;
    application.updatedAt = Date.now();
    
    if (status === 'Verified') {
      application.verificationDate = Date.now();
      application.verifiedBy = adminName;
    }

    application.statusHistory.push({
      status,
      updatedBy: adminName,
      remarks: remarks || ''
    });

    await application.save();

    // Create Audit Log
    await StatusLog.create({
      adminName: adminName,
      applicationId: application.applicationId || application._id.toString(),
      applicationMongoId: application._id,
      oldStatus,
      newStatus: status,
      remarks: remarks || ''
    });

    // Send Email
    emailService.sendStatusEmail(application);

    res.status(200).json({ success: true, message: 'Application status updated successfully.', application });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// GET /api/admin/application/:id/history
exports.getApplicationHistory = async (req, res) => {
  try {
    const logs = await StatusLog.find({ applicationMongoId: req.params.id }).sort({ timestamp: 1 });
    res.status(200).json({ success: true, history: logs });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};
