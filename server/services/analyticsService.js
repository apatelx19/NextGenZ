const Application = require('../models/Application');
const StatusLog = require('../models/StatusLog');
const Review = require('../models/Review');
const mongoose = require('mongoose');

class AnalyticsService {
  /**
   * Helper to build date match query
   */
  getDateMatch(dateFilter) {
    const match = {};
    const now = new Date();
    
    switch(dateFilter) {
      case 'today':
        now.setHours(0, 0, 0, 0);
        match.createdAt = { $gte: now };
        break;
      case '7days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        match.createdAt = { $gte: sevenDaysAgo };
        break;
      case '30days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        match.createdAt = { $gte: thirtyDaysAgo };
        break;
      case 'thisMonth':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        match.createdAt = { $gte: firstDayOfMonth };
        break;
      case 'thisYear':
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        match.createdAt = { $gte: firstDayOfYear };
        break;
      default:
        // No filter (all time)
        break;
    }
    return match;
  }

  /**
   * Gets overall top statistics for the cards
   */
  async getOverviewStats(dateFilter) {
    const match = this.getDateMatch(dateFilter);
    const allMatch = {}; // For metrics that shouldn't always be filtered (like Total)

    // Calculate Today and This Month for specific cards regardless of the global filter
    const today = new Date();
    today.setHours(0,0,0,0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalApplications, 
      paidApplications,
      applicationsToday,
      applicationsThisMonth,
      pending,
      selected,
      rejected,
      activeBatches,
      totalReviews,
      pendingReviews,
      avgRatingResult,
      revenueAgg
    ] = await Promise.all([
      Application.countDocuments(match),
      Application.countDocuments({ ...match, paymentId: { $exists: true } }),
      Application.countDocuments({ createdAt: { $gte: today } }),
      Application.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      Application.countDocuments({ ...match, status: 'Pending' }),
      Application.countDocuments({ ...match, status: 'Selected' }),
      Application.countDocuments({ ...match, status: 'Rejected' }),
      Application.distinct('internshipBatch', match),
      Review.countDocuments(match),
      Review.countDocuments({ ...match, status: 'Pending' }),
      Review.aggregate([{ $match: match }, { $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
      Application.aggregate([
        { $match: { ...match, paymentId: { $exists: true } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$plan', 'Free'] },    then: 0    },
                    { case: { $eq: ['$plan', 'Normal'] },  then: 299  },
                    { case: { $eq: ['$plan', 'Gold'] },    then: 499  },
                    { case: { $eq: ['$plan', 'Premium'] }, then: 1499 }
                  ],
                  default: 299
                }
              }
            }
          }
        }
      ])
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    const avgReviewRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating.toFixed(1) : 0;

    return {
      totalApplications,
      totalRevenue,
      applicationsToday,
      applicationsThisMonth,
      pending,
      selected,
      rejected,
      activeBatches: activeBatches.length,
      totalReviews,
      pendingReviews,
      avgReviewRating
    };
  }

  /**
   * Gets aggregated data for all charts
   */
  async getChartData(dateFilter) {
    const match = this.getDateMatch(dateFilter);

    // 1. Domain Stats (Bar/Pie)
    const domainStats = await Application.aggregate([
      { $match: match },
      { $group: { _id: "$domain", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 2. Status Distribution (Doughnut)
    const statusStats = await Application.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3. Application Trend (Line) - Group by Day
    const applicationTrend = await Application.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);

    // 4. Revenue Trend (Line) - Group by Month
    const revenueTrend = await Application.aggregate([
      { $match: { ...match, paymentId: { $exists: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$plan', 'Free'] },    then: 0    },
                  { case: { $eq: ['$plan', 'Normal'] },  then: 299  },
                  { case: { $eq: ['$plan', 'Gold'] },    then: 499  },
                  { case: { $eq: ['$plan', 'Premium'] }, then: 1499 }
                ],
                default: 299
              }
            }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 5. Review Ratings Distribution (Bar/Doughnut)
    const reviewDistribution = await Review.aggregate([
      { $match: match },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { "_id": -1 } }
    ]);

    return {
      domainStats,
      statusStats,
      applicationTrend,
      revenueTrend,
      reviewDistribution
    };
  }

  /**
   * Gets recent activity feed
   */
  async getRecentActivity(limit = 10) {
    // We can combine recent applications and status changes
    // For simplicity, let's fetch recent status logs and recent applications, then sort them in memory
    
    const recentLogs = await StatusLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    const recentApps = await Application.find().sort({ createdAt: -1 }).limit(limit).lean();

    const activities = [];

    recentLogs.forEach(log => {
      activities.push({
        type: 'status_update',
        timestamp: log.timestamp,
        description: `Admin ${log.adminName} updated ${log.applicationId || 'Application'} from ${log.oldStatus} to ${log.newStatus}.`
      });
    });

    recentApps.forEach(app => {
      activities.push({
        type: 'new_application',
        timestamp: app.createdAt,
        description: `${app.fullName} applied for ${app.domain} Internship.`
      });
      if(app.paymentId) {
        activities.push({
          type: 'payment',
          timestamp: app.createdAt,
          description: `Payment of ₹199 received for ${app.fullName}.`
        });
      }
    });

    // Sort descending by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return activities.slice(0, limit);
  }
}

module.exports = new AnalyticsService();
