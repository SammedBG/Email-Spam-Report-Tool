import express from 'express';
import { monitoringService } from '../services/monitoringService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get system metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = monitoringService.getMetrics();
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString()
  });
}));

// Get detailed analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  const analytics = await monitoringService.getAnalytics(timeframe);
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
}));

// Get health status
router.get('/health', asyncHandler(async (req, res) => {
  const health = await monitoringService.healthCheck();
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health,
    timestamp: new Date().toISOString()
  });
}));

// Get performance metrics
router.get('/performance', asyncHandler(async (req, res) => {
  const performance = monitoringService.getPerformanceMetrics();
  
  res.json({
    success: true,
    data: performance,
    timestamp: new Date().toISOString()
  });
}));

// Get system status
router.get('/status', asyncHandler(async (req, res) => {
  const metrics = monitoringService.getMetrics();
  const performance = monitoringService.getPerformanceMetrics();
  const health = await monitoringService.healthCheck();
  
  res.json({
    success: true,
    data: {
      health,
      metrics,
      performance,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;
