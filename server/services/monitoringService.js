import { TestResult } from '../models/TestResult.js';

export class MonitoringService {
  constructor() {
    this.metrics = {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      averageScore: 0,
      apiCalls: 0,
      apiErrors: 0,
      emailSent: 0,
      emailFailed: 0,
      startTime: new Date()
    };
    
    this.initializeMetrics();
  }

  async initializeMetrics() {
    try {
      // Get initial metrics from database
      const totalTests = await TestResult.countDocuments();
      const successfulTests = await TestResult.countDocuments({ status: 'completed' });
      const failedTests = await TestResult.countDocuments({ status: 'error' });
      
      // Calculate average score
      const completedTests = await TestResult.find({ status: 'completed' }).select('score');
      const averageScore = completedTests.length > 0 
        ? completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length 
        : 0;

      this.metrics = {
        ...this.metrics,
        totalTests,
        successfulTests,
        failedTests,
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('Failed to initialize metrics:', error);
    }
  }

  // Track test completion
  trackTestCompletion(testData) {
    this.metrics.totalTests++;
    
    if (testData.status === 'completed') {
      this.metrics.successfulTests++;
      this.updateAverageScore(testData.score);
    } else if (testData.status === 'error') {
      this.metrics.failedTests++;
    }
  }

  // Track API calls
  trackAPICall(success = true) {
    this.metrics.apiCalls++;
    if (!success) {
      this.metrics.apiErrors++;
    }
  }

  // Track email notifications
  trackEmailSent(success = true) {
    if (success) {
      this.metrics.emailSent++;
    } else {
      this.metrics.emailFailed++;
    }
  }

  // Update average score
  updateAverageScore(newScore) {
    const totalCompleted = this.metrics.successfulTests;
    const currentAverage = this.metrics.averageScore;
    this.metrics.averageScore = Math.round(
      ((currentAverage * (totalCompleted - 1)) + newScore) / totalCompleted
    );
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime.getTime();
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60));
    
    return {
      ...this.metrics,
      uptime: uptimeHours,
      successRate: this.metrics.totalTests > 0 
        ? Math.round((this.metrics.successfulTests / this.metrics.totalTests) * 100) 
        : 0,
      apiErrorRate: this.metrics.apiCalls > 0 
        ? Math.round((this.metrics.apiErrors / this.metrics.apiCalls) * 100) 
        : 0,
      emailSuccessRate: (this.metrics.emailSent + this.metrics.emailFailed) > 0 
        ? Math.round((this.metrics.emailSent / (this.metrics.emailSent + this.metrics.emailFailed)) * 100) 
        : 0
    };
  }

  // Get detailed analytics
  async getAnalytics(timeframe = '7d') {
    try {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get test statistics
      const tests = await TestResult.find({
        createdAt: { $gte: startDate }
      }).select('status score result createdAt userEmail');

      const analytics = {
        timeframe,
        totalTests: tests.length,
        completedTests: tests.filter(t => t.status === 'completed').length,
        failedTests: tests.filter(t => t.status === 'error').length,
        pendingTests: tests.filter(t => t.status === 'pending').length,
        averageScore: 0,
        scoreDistribution: {
          excellent: 0, // 90-100
          good: 0,      // 70-89
          fair: 0,      // 50-69
          poor: 0       // 0-49
        },
        providerStats: {},
        dailyStats: {},
        topUsers: []
      };

      // Calculate average score
      const completedTests = tests.filter(t => t.status === 'completed' && t.score !== undefined);
      if (completedTests.length > 0) {
        analytics.averageScore = Math.round(
          completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length
        );
      }

      // Score distribution
      completedTests.forEach(test => {
        if (test.score >= 90) analytics.scoreDistribution.excellent++;
        else if (test.score >= 70) analytics.scoreDistribution.good++;
        else if (test.score >= 50) analytics.scoreDistribution.fair++;
        else analytics.scoreDistribution.poor++;
      });

      // Provider statistics
      const providers = ['Gmail', 'Outlook', 'Yahoo', 'iCloud', 'Proton'];
      providers.forEach(provider => {
        analytics.providerStats[provider] = {
          total: 0,
          inbox: 0,
          spam: 0,
          promotions: 0,
          notFound: 0,
          error: 0
        };
      });

      completedTests.forEach(test => {
        if (test.result && Array.isArray(test.result)) {
          test.result.forEach(result => {
            const provider = result.provider;
            if (analytics.providerStats[provider]) {
              analytics.providerStats[provider].total++;
              const placement = result.placement?.toLowerCase() || 'error';
              if (analytics.providerStats[provider][placement] !== undefined) {
                analytics.providerStats[provider][placement]++;
              }
            }
          });
        }
      });

      // Daily statistics
      const dailyStats = {};
      tests.forEach(test => {
        const date = test.createdAt.toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { total: 0, completed: 0, failed: 0 };
        }
        dailyStats[date].total++;
        if (test.status === 'completed') dailyStats[date].completed++;
        if (test.status === 'error') dailyStats[date].failed++;
      });
      analytics.dailyStats = dailyStats;

      // Top users by test count
      const userStats = {};
      tests.forEach(test => {
        if (!userStats[test.userEmail]) {
          userStats[test.userEmail] = { count: 0, lastTest: test.createdAt };
        }
        userStats[test.userEmail].count++;
        if (test.createdAt > userStats[test.userEmail].lastTest) {
          userStats[test.userEmail].lastTest = test.createdAt;
        }
      });

      analytics.topUsers = Object.entries(userStats)
        .map(([email, stats]) => ({ email, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const metrics = this.getMetrics();
      const dbHealth = await this.checkDatabaseHealth();
      const emailHealth = await this.checkEmailHealth();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics,
        services: {
          database: dbHealth,
          email: emailHealth
        },
        uptime: metrics.uptime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await TestResult.findOne().limit(1);
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  // Check email service health
  async checkEmailHealth() {
    try {
      const { emailService } = await import('./emailService.js');
      const testResult = await emailService.testConfiguration();
      
      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        service: process.env.EMAIL_SERVICE || 'sendgrid',
        configured: !!process.env.SENDGRID_API_KEY || !!process.env.SMTP_HOST
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        configured: false
      };
    }
  }

  // Get system performance metrics
  getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  // Reset metrics (for testing)
  resetMetrics() {
    this.metrics = {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      averageScore: 0,
      apiCalls: 0,
      apiErrors: 0,
      emailSent: 0,
      emailFailed: 0,
      startTime: new Date()
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();