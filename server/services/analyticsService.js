import { TestResult } from '../models/TestResult.js';
import { User } from '../models/User.js';

export class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive analytics dashboard
  async getDashboardAnalytics(timeframe = '7d', userId = null) {
    const cacheKey = `dashboard_${timeframe}_${userId || 'global'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const startDate = this.getStartDate(timeframe);
      const filter = this.buildFilter(startDate, userId);
      
      const [
        testStats,
        userStats,
        providerStats,
        scoreDistribution,
        dailyTrends,
        topUsers,
        recentActivity
      ] = await Promise.all([
        this.getTestStatistics(filter),
        this.getUserStatistics(filter),
        this.getProviderStatistics(filter),
        this.getScoreDistribution(filter),
        this.getDailyTrends(filter, timeframe),
        this.getTopUsers(filter),
        this.getRecentActivity(filter)
      ]);

      const analytics = {
        timeframe,
        generatedAt: new Date().toISOString(),
        overview: {
          totalTests: testStats.total,
          completedTests: testStats.completed,
          failedTests: testStats.failed,
          averageScore: testStats.averageScore,
          successRate: testStats.successRate
        },
        users: userStats,
        providers: providerStats,
        scoreDistribution,
        trends: dailyTrends,
        topUsers,
        recentActivity
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('Failed to get dashboard analytics:', error);
      throw error;
    }
  }

  // Get test statistics
  async getTestStatistics(filter) {
    const total = await TestResult.countDocuments(filter);
    const completed = await TestResult.countDocuments({ ...filter, status: 'completed' });
    const failed = await TestResult.countDocuments({ ...filter, status: 'error' });
    
    // Calculate average score
    const completedTests = await TestResult.find({ ...filter, status: 'completed' }).select('score');
    const averageScore = completedTests.length > 0 
      ? Math.round(completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length)
      : 0;

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      failed,
      averageScore,
      successRate
    };
  }

  // Get user statistics
  async getUserStatistics(filter) {
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeUsers = await TestResult.distinct('userEmail', filter).then(emails => emails.length);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: filter.createdAt },
      isActive: true
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };
  }

  // Get provider statistics
  async getProviderStatistics(filter) {
    const providers = ['Gmail', 'Outlook', 'Yahoo', 'iCloud', 'Proton'];
    const providerStats = {};

    for (const provider of providers) {
      const tests = await TestResult.find({
        ...filter,
        status: 'completed',
        'result.provider': provider
      }).select('result');

      const stats = {
        total: tests.length,
        inbox: 0,
        spam: 0,
        promotions: 0,
        notFound: 0,
        error: 0
      };

      tests.forEach(test => {
        const providerResult = test.result.find(r => r.provider === provider);
        if (providerResult) {
          const placement = providerResult.placement?.toLowerCase() || 'error';
          if (stats[placement] !== undefined) {
            stats[placement]++;
          }
        }
      });

      // Calculate success rate
      stats.successRate = stats.total > 0 
        ? Math.round(((stats.inbox + stats.promotions) / stats.total) * 100)
        : 0;

      providerStats[provider] = stats;
    }

    return providerStats;
  }

  // Get score distribution
  async getScoreDistribution(filter) {
    const tests = await TestResult.find({
      ...filter,
      status: 'completed'
    }).select('score');

    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      fair: 0,      // 50-69
      poor: 0       // 0-49
    };

    tests.forEach(test => {
      if (test.score >= 90) distribution.excellent++;
      else if (test.score >= 70) distribution.good++;
      else if (test.score >= 50) distribution.fair++;
      else distribution.poor++;
    });

    return distribution;
  }

  // Get daily trends
  async getDailyTrends(filter, timeframe) {
    const days = this.getDaysArray(timeframe);
    const trends = {};

    for (const day of days) {
      const dayFilter = {
        ...filter,
        createdAt: {
          $gte: new Date(day),
          $lt: new Date(new Date(day).getTime() + 24 * 60 * 60 * 1000)
        }
      };

      const dayStats = await this.getTestStatistics(dayFilter);
      trends[day] = dayStats;
    }

    return trends;
  }

  // Get top users
  async getTopUsers(filter) {
    const pipeline = [
      { $match: filter },
      { $group: { _id: '$userEmail', testCount: { $sum: 1 } } },
      { $sort: { testCount: -1 } },
      { $limit: 10 }
    ];

    const topUsers = await TestResult.aggregate(pipeline);
    
    // Get user details
    const userEmails = topUsers.map(user => user._id);
    const users = await User.find({ email: { $in: userEmails } }).select('firstName lastName company');
    
    return topUsers.map(user => {
      const userDetails = users.find(u => u.email === user._id);
      return {
        email: user._id,
        testCount: user.testCount,
        firstName: userDetails?.firstName,
        lastName: userDetails?.lastName,
        company: userDetails?.company
      };
    });
  }

  // Get recent activity
  async getRecentActivity(filter) {
    const recentTests = await TestResult.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('code userEmail status score createdAt');

    return recentTests.map(test => ({
      code: test.code,
      userEmail: test.userEmail,
      status: test.status,
      score: test.score,
      createdAt: test.createdAt
    }));
  }

  // Get user-specific analytics
  async getUserAnalytics(userEmail, timeframe = '7d') {
    const startDate = this.getStartDate(timeframe);
    const filter = {
      userEmail,
      createdAt: { $gte: startDate }
    };

    const [
      testStats,
      providerStats,
      scoreDistribution,
      dailyTrends
    ] = await Promise.all([
      this.getTestStatistics(filter),
      this.getProviderStatistics(filter),
      this.getScoreDistribution(filter),
      this.getDailyTrends(filter, timeframe)
    ]);

    return {
      timeframe,
      userEmail,
      generatedAt: new Date().toISOString(),
      overview: testStats,
      providers: providerStats,
      scoreDistribution,
      trends: dailyTrends
    };
  }

  // Get provider performance analytics
  async getProviderPerformance(timeframe = '7d') {
    const startDate = this.getStartDate(timeframe);
    const filter = {
      status: 'completed',
      createdAt: { $gte: startDate }
    };

    const providers = ['Gmail', 'Outlook', 'Yahoo', 'iCloud', 'Proton'];
    const performance = {};

    for (const provider of providers) {
      const tests = await TestResult.find({
        ...filter,
        'result.provider': provider
      }).select('result score');

      const stats = {
        totalTests: tests.length,
        averageScore: 0,
        inboxRate: 0,
        spamRate: 0,
        promotionsRate: 0,
        performance: []
      };

      if (tests.length > 0) {
        let totalScore = 0;
        let inboxCount = 0;
        let spamCount = 0;
        let promotionsCount = 0;

        tests.forEach(test => {
          const providerResult = test.result.find(r => r.provider === provider);
          if (providerResult) {
            totalScore += test.score;
            
            switch (providerResult.placement?.toLowerCase()) {
              case 'inbox':
                inboxCount++;
                break;
              case 'spam':
                spamCount++;
                break;
              case 'promotions':
                promotionsCount++;
                break;
            }
          }
        });

        stats.averageScore = Math.round(totalScore / tests.length);
        stats.inboxRate = Math.round((inboxCount / tests.length) * 100);
        stats.spamRate = Math.round((spamCount / tests.length) * 100);
        stats.promotionsRate = Math.round((promotionsCount / tests.length) * 100);
      }

      performance[provider] = stats;
    }

    return performance;
  }

  // Helper methods
  getStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  buildFilter(startDate, userId) {
    const filter = {
      createdAt: { $gte: startDate }
    };

    if (userId) {
      const user = User.findById(userId);
      if (user) {
        filter.userEmail = user.email;
      }
    }

    return filter;
  }

  getDaysArray(timeframe) {
    const days = [];
    const now = new Date();
    const daysCount = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(day.toISOString().split('T')[0]);
    }
    
    return days;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Cleanup cache every 10 minutes
setInterval(() => {
  analyticsService.cleanupCache();
}, 10 * 60 * 1000);
