const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const auth = require('../middleware/auth');

// Apply auth middleware
router.use(auth);

router.get('/csv', exportController.exportCSV);
router.get('/excel', exportController.exportExcel);

module.exports = router;
