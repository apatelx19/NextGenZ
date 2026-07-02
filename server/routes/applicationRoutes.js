const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { validateApplication } = require('../middleware/validators');

router.post('/submit-application', validateApplication, applicationController.submitDirectApplication);

module.exports = router;
