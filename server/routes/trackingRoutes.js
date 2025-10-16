import express from 'express';
import { trackingService } from '../services/trackingService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Track email open (pixel)
router.get('/pixel/:trackingId', asyncHandler(async (req, res) => {
  const { trackingId } = req.params;
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;

  try {
    await trackingService.trackOpen(trackingId, userAgent, ip);
    
    // Return 1x1 transparent pixel
    const pixel = trackingService.serveTrackingPixel(trackingId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pixel);
  } catch (error) {
    console.error('Failed to track email open:', error);
    // Still return pixel even if tracking fails
    const pixel = trackingService.serveTrackingPixel(trackingId);
    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
  }
}));

// Track email click (redirect)
router.get('/click/:trackingId', asyncHandler(async (req, res) => {
  const { trackingId } = req.params;
  const { url } = req.query;
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const result = await trackingService.trackClick(trackingId, userAgent, ip);
    
    if (result.success && result.redirectUrl) {
      res.redirect(result.redirectUrl);
    } else {
      // Fallback redirect
      const fallbackUrl = url ? decodeURIComponent(url) : process.env.CLIENT_ORIGIN;
      res.redirect(fallbackUrl);
    }
  } catch (error) {
    console.error('Failed to track email click:', error);
    // Fallback redirect
    const fallbackUrl = url ? decodeURIComponent(url) : process.env.CLIENT_ORIGIN;
    res.redirect(fallbackUrl);
  }
}));

// Get tracking statistics for a test
router.get('/stats/:testCode', asyncHandler(async (req, res) => {
  const { testCode } = req.params;
  
  const stats = await trackingService.getTestTrackingStats(testCode);
  
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
}));

// Get global tracking analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  
  const analytics = await trackingService.getGlobalTrackingAnalytics(timeframe);
  
  res.json({
    success: true,
    data: analytics,
    timestamp: new Date().toISOString()
  });
}));

export default router;
