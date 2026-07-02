const Application = require('../models/Application');

// GET /api/admin/dashboard/stats and /api/admin/analytics
// Have been moved to analyticsController.js

// GET /api/admin/applications
exports.getApplications = async (req, res) => {
  try {
    const { search, domain, status, internshipBatch, sort, page = 1, limit = 10 } = req.query;
    
    // Build query object
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (domain) query.domain = domain;
    if (status) query.status = status;
    if (internshipBatch) query.internshipBatch = internshipBatch;

    // Sorting
    let sortObj = { createdAt: -1 }; // Default newest first
    if (sort === 'oldest') sortObj = { createdAt: 1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      applications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

// GET /api/admin/application/:id
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, message: 'Server error fetching application' });
  }
};

// DELETE /api/admin/application/:id
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    // Delete resume from Cloudinary
    if (application.resume && application.resume.publicId) {
      const cloudinary = require('../config/cloudinary');
      try {
        await cloudinary.uploader.destroy(application.resume.publicId);
      } catch (cloudErr) {
        console.error('Error deleting file from Cloudinary:', cloudErr);
      }
    }

    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, message: 'Server error deleting application' });
  }
};
