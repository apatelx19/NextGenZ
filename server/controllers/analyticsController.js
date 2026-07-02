const analyticsService = require('../services/analyticsService');

exports.getOverview = async (req, res) => {
  try {
    const dateFilter = req.query.filter || 'all';
    const stats = await analyticsService.getOverviewStats(dateFilter);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCharts = async (req, res) => {
  try {
    const dateFilter = req.query.filter || 'all';
    const charts = await analyticsService.getChartData(dateFilter);
    res.status(200).json({ success: true, charts });
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activity = await analyticsService.getRecentActivity(limit);
    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
