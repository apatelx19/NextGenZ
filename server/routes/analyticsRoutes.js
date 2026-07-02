const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/overview', analyticsController.getOverview);
router.get('/charts', analyticsController.getCharts);
router.get('/activity', analyticsController.getActivity);

module.exports = router;
