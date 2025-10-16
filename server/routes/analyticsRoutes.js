import express from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { timeframe = '7d', userId } = req.query;
  
  const analytics = await analyticsService.getDashboardAnalytics(timeframe, userId);
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
}));

// Get user-specific analytics
router.get('/user/:userEmail', asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  const { timeframe = '7d' } = req.query;
  
  const analytics = await analyticsService.getUserAnalytics(userEmail, timeframe);
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
}));

// Get provider performance analytics
router.get('/providers', asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  
  const performance = await analyticsService.getProviderPerformance(timeframe);
  
  res.json({
    success: true,
    data: performance,
    timestamp: new Date().toISOString()
  });
}));

// Get score distribution
router.get('/scores', asyncHandler(async (req, res) => {
  const { timeframe = '7d', userId } = req.query;
  
  const startDate = analyticsService.getStartDate(timeframe);
  const filter = analyticsService.buildFilter(startDate, userId);
  
  const distribution = await analyticsService.getScoreDistribution(filter);
  
  res.json({
    success: true,
    data: distribution,
    timestamp: new Date().toISOString()
  });
}));

// Get daily trends
router.get('/trends', asyncHandler(async (req, res) => {
  const { timeframe = '7d', userId } = req.query;
  
  const startDate = analyticsService.getStartDate(timeframe);
  const filter = analyticsService.buildFilter(startDate, userId);
  
  const trends = await analyticsService.getDailyTrends(filter, timeframe);
  
  res.json({
    success: true,
    data: trends,
    timestamp: new Date().toISOString()
  });
}));

// Get top users
router.get('/top-users', asyncHandler(async (req, res) => {
  const { timeframe = '7d', limit = 10 } = req.query;
  
  const startDate = analyticsService.getStartDate(timeframe);
  const filter = analyticsService.buildFilter(startDate, null);
  
  const topUsers = await analyticsService.getTopUsers(filter);
  
  res.json({
    success: true,
    data: topUsers.slice(0, parseInt(limit)),
    timestamp: new Date().toISOString()
  });
}));

// Get recent activity
router.get('/recent', asyncHandler(async (req, res) => {
  const { timeframe = '7d', userId, limit = 20 } = req.query;
  
  const startDate = analyticsService.getStartDate(timeframe);
  const filter = analyticsService.buildFilter(startDate, userId);
  
  const activity = await analyticsService.getRecentActivity(filter);
  
  res.json({
    success: true,
    data: activity.slice(0, parseInt(limit)),
    timestamp: new Date().toISOString()
  });
}));

export default router;
