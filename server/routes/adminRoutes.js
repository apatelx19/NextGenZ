const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth'); // Protect all these routes

// All routes here are prefixed with /api/admin and protected by auth middleware
router.use(auth);

// Dashboard & Analytics
// Handled by analyticsRoutes now

// Application Management
router.get('/applications', adminController.getApplications);
router.get('/application/:id', adminController.getApplicationById);
router.delete('/application/:id', adminController.deleteApplication);

module.exports = router;
