import { TestResult } from '../models/TestResult.js';
import crypto from 'crypto';

export class TrackingService {
  constructor() {
    this.trackingData = new Map(); // In production, use Redis
    this.pixelCache = new Map();
  }

  // Generate tracking pixel for email opens
  generateTrackingPixel(testCode, userEmail) {
    const trackingId = crypto.randomUUID();
    const pixelData = {
      testCode,
      userEmail,
      type: 'open',
      timestamp: new Date(),
      userAgent: null,
      ip: null
    };

    this.trackingData.set(trackingId, pixelData);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    this.pixelCache.set(trackingId, pixel);
    return { trackingId, pixel };
  }

  // Generate tracking URL for email clicks
  generateTrackingUrl(testCode, userEmail, originalUrl) {
    const trackingId = crypto.randomUUID();
    const encodedUrl = encodeURIComponent(originalUrl);
    
    const trackingData = {
      testCode,
      userEmail,
      type: 'click',
      originalUrl,
      timestamp: new Date(),
      userAgent: null,
      ip: null
    };

    this.trackingData.set(trackingId, trackingData);
    
    const trackingUrl = `${process.env.CLIENT_ORIGIN}/track/${trackingId}?url=${encodedUrl}`;
    return { trackingId, trackingUrl };
  }

  // Track email open
  async trackOpen(trackingId, userAgent, ip) {
    try {
      const trackingData = this.trackingData.get(trackingId);
      if (!trackingData) {
        throw new Error('Invalid tracking ID');
      }

      // Update tracking data
      trackingData.userAgent = userAgent;
      trackingData.ip = ip;
      trackingData.timestamp = new Date();

      // Update database
      await this.updateTestTracking(trackingData.testCode, 'open', {
        userAgent,
        ip,
        timestamp: trackingData.timestamp
      });

      console.log(`📧 Email opened: ${trackingData.userEmail} - Test: ${trackingData.testCode}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to track email open:', error);
      return { success: false, error: error.message };
    }
  }

  // Track email click
  async trackClick(trackingId, userAgent, ip) {
    try {
      const trackingData = this.trackingData.get(trackingId);
      if (!trackingData) {
        throw new Error('Invalid tracking ID');
      }

      // Update tracking data
      trackingData.userAgent = userAgent;
      trackingData.ip = ip;
      trackingData.timestamp = new Date();

      // Update database
      await this.updateTestTracking(trackingData.testCode, 'click', {
        userAgent,
        ip,
        timestamp: trackingData.timestamp,
        originalUrl: trackingData.originalUrl
      });

      console.log(`🔗 Email clicked: ${trackingData.userEmail} - Test: ${trackingData.testCode}`);
      return { 
        success: true, 
        redirectUrl: trackingData.originalUrl 
      };
    } catch (error) {
      console.error('Failed to track email click:', error);
      return { success: false, error: error.message };
    }
  }

  // Update test tracking in database
  async updateTestTracking(testCode, eventType, eventData) {
    try {
      const test = await TestResult.findOne({ code: testCode });
      if (!test) {
        throw new Error('Test not found');
      }

      // Initialize tracking if not exists
      if (!test.tracking) {
        test.tracking = {
          opens: [],
          clicks: [],
          lastOpened: null,
          lastClicked: null
        };
      }

      // Add event to tracking
      if (eventType === 'open') {
        test.tracking.opens.push(eventData);
        test.tracking.lastOpened = eventData.timestamp;
      } else if (eventType === 'click') {
        test.tracking.clicks.push(eventData);
        test.tracking.lastClicked = eventData.timestamp;
      }

      await test.save();
      return { success: true };
    } catch (error) {
      console.error('Failed to update test tracking:', error);
      throw error;
    }
  }

  // Get tracking statistics for a test
  async getTestTrackingStats(testCode) {
    try {
      const test = await TestResult.findOne({ code: testCode });
      if (!test || !test.tracking) {
        return {
          opens: 0,
          clicks: 0,
          openRate: 0,
          clickRate: 0,
          lastOpened: null,
          lastClicked: null
        };
      }

      const { opens, clicks } = test.tracking;
      const openRate = opens.length > 0 ? 100 : 0;
      const clickRate = opens.length > 0 ? (clicks.length / opens.length) * 100 : 0;

      return {
        opens: opens.length,
        clicks: clicks.length,
        openRate: Math.round(openRate),
        clickRate: Math.round(clickRate),
        lastOpened: test.tracking.lastOpened,
        lastClicked: test.tracking.lastClicked
      };
    } catch (error) {
      console.error('Failed to get tracking stats:', error);
      throw error;
    }
  }

  // Get global tracking analytics
  async getGlobalTrackingAnalytics(timeframe = '7d') {
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

      const tests = await TestResult.find({
        createdAt: { $gte: startDate },
        tracking: { $exists: true }
      }).select('tracking userEmail createdAt');

      const analytics = {
        timeframe,
        totalEmails: tests.length,
        totalOpens: 0,
        totalClicks: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        topPerformingTests: [],
        dailyStats: {},
        deviceStats: {
          desktop: 0,
          mobile: 0,
          tablet: 0,
          unknown: 0
        }
      };

      // Calculate statistics
      tests.forEach(test => {
        if (test.tracking) {
          analytics.totalOpens += test.tracking.opens.length;
          analytics.totalClicks += test.tracking.clicks.length;

          // Device statistics
          test.tracking.opens.forEach(open => {
            const device = this.detectDevice(open.userAgent);
            analytics.deviceStats[device]++;
          });

          // Daily statistics
          const date = test.createdAt.toISOString().split('T')[0];
          if (!analytics.dailyStats[date]) {
            analytics.dailyStats[date] = { opens: 0, clicks: 0 };
          }
          analytics.dailyStats[date].opens += test.tracking.opens.length;
          analytics.dailyStats[date].clicks += test.tracking.clicks.length;
        }
      });

      // Calculate rates
      if (analytics.totalEmails > 0) {
        analytics.averageOpenRate = Math.round((analytics.totalOpens / analytics.totalEmails) * 100);
      }
      if (analytics.totalOpens > 0) {
        analytics.averageClickRate = Math.round((analytics.totalClicks / analytics.totalOpens) * 100);
      }

      // Top performing tests
      const testPerformance = tests.map(test => ({
        testCode: test.code,
        userEmail: test.userEmail,
        opens: test.tracking?.opens.length || 0,
        clicks: test.tracking?.clicks.length || 0,
        openRate: test.tracking?.opens.length > 0 ? 100 : 0,
        clickRate: test.tracking?.opens.length > 0 ? 
          Math.round((test.tracking.clicks.length / test.tracking.opens.length) * 100) : 0
      })).sort((a, b) => b.opens - a.opens).slice(0, 10);

      analytics.topPerformingTests = testPerformance;

      return analytics;
    } catch (error) {
      console.error('Failed to get global tracking analytics:', error);
      throw error;
    }
  }

  // Detect device type from user agent
  detectDevice(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh')) {
      return 'desktop';
    }
    return 'unknown';
  }

  // Serve tracking pixel
  serveTrackingPixel(trackingId) {
    const pixel = this.pixelCache.get(trackingId);
    if (!pixel) {
      // Return default transparent pixel
      return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
    }
    return pixel;
  }

  // Clean up old tracking data
  cleanupTrackingData() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [trackingId, data] of this.trackingData.entries()) {
      if (data.timestamp < oneWeekAgo) {
        this.trackingData.delete(trackingId);
        this.pixelCache.delete(trackingId);
      }
    }
  }
}

// Singleton instance
export const trackingService = new TrackingService();

// Cleanup old data every hour
setInterval(() => {
  trackingService.cleanupTrackingData();
}, 60 * 60 * 1000);
