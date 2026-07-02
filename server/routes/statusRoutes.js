const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const auth = require('../middleware/auth');

router.put('/application/:id/status', auth, statusController.updateApplicationStatus);
router.get('/application/:id/history', auth, statusController.getApplicationHistory);

module.exports = router;
