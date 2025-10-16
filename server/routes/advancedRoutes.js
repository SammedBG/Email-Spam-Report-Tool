import express from 'express';
import { mlService } from '../services/machineLearningService.js';
import { advancedReportingService } from '../services/advancedReportingService.js';
import { collaborationService } from '../services/collaborationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createValidationMiddleware } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// ML Prediction endpoints
router.post('/ml/predict', 
  createValidationMiddleware(Joi.object({
    subject: Joi.string().required(),
    body: Joi.string().required(),
    senderEmail: Joi.string().email().required()
  })),
  asyncHandler(async (req, res) => {
    const { subject, body, senderEmail } = req.body;
    
    const prediction = await mlService.predictDeliverability({
      subject,
      body,
      senderEmail
    });
    
    res.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  })
);

router.get('/ml/performance', asyncHandler(async (req, res) => {
  const performance = await mlService.getModelPerformance();
  
  res.json({
    success: true,
    data: performance,
    timestamp: new Date().toISOString()
  });
}));

router.post('/ml/retrain', asyncHandler(async (req, res) => {
  const result = await mlService.retrainModel();
  
  res.json({
    success: result.success,
    message: result.success ? 'Model retrained successfully' : 'Failed to retrain model',
    data: result,
    timestamp: new Date().toISOString()
  });
}));

// Advanced Reporting endpoints
router.get('/reports/:testCode', asyncHandler(async (req, res) => {
  const { testCode } = req.params;
  const { type = 'executive', userId } = req.query;
  
  const report = await advancedReportingService.generateAdvancedReport(
    testCode, 
    type, 
    userId
  );
  
  res.json({
    success: report.success,
    data: report.report,
    generatedAt: report.generatedAt
  });
}));

router.get('/reports/:testCode/pdf', asyncHandler(async (req, res) => {
  const { testCode } = req.params;
  const { type = 'executive', userId } = req.query;
  
  try {
    const pdfBuffer = await advancedReportingService.generatePDFReport(
      testCode, 
      type, 
      userId
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${testCode}-${type}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Collaboration endpoints
router.post('/collaboration/sessions',
  createValidationMiddleware(Joi.object({
    testCode: Joi.string().required(),
    permissions: Joi.object({
      canView: Joi.boolean().default(true),
      canComment: Joi.boolean().default(false),
      canEdit: Joi.boolean().default(false),
      canShare: Joi.boolean().default(false)
    }).optional()
  })),
  asyncHandler(async (req, res) => {
    const { testCode, permissions } = req.body;
    const ownerId = req.user?.id;
    
    const result = await collaborationService.createSharedSession(
      testCode, 
      ownerId, 
      permissions
    );
    
    res.status(result.success ? 201 : 400).json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  })
);

router.post('/collaboration/sessions/:sessionId/join', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?.id;
  
  const result = await collaborationService.joinSharedSession(sessionId, userId);
  
  res.json({
    success: result.success,
    data: result,
    timestamp: new Date().toISOString()
  });
}));

router.get('/collaboration/sessions', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  const result = await collaborationService.getUserSessions(userId);
  
  res.json({
    success: result.success,
    data: result.sessions,
    timestamp: new Date().toISOString()
  });
}));

router.post('/collaboration/sessions/:sessionId/end', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?.id;
  
  const result = await collaborationService.endSharedSession(sessionId, userId);
  
  res.json({
    success: result.success,
    message: result.success ? 'Session ended successfully' : 'Failed to end session',
    timestamp: new Date().toISOString()
  });
}));

// Comments endpoints
router.post('/collaboration/comments',
  createValidationMiddleware(Joi.object({
    testCode: Joi.string().required(),
    comment: Joi.string().min(1).max(1000).required(),
    sessionId: Joi.string().optional()
  })),
  asyncHandler(async (req, res) => {
    const { testCode, comment, sessionId } = req.body;
    const userId = req.user?.id;
    
    const result = await collaborationService.addComment(
      testCode, 
      userId, 
      comment, 
      sessionId
    );
    
    res.status(result.success ? 201 : 400).json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  })
);

router.get('/collaboration/comments/:testCode', asyncHandler(async (req, res) => {
  const { testCode } = req.params;
  const { sessionId } = req.query;
  
  const result = await collaborationService.getComments(testCode, sessionId);
  
  res.json({
    success: result.success,
    data: result.comments,
    timestamp: new Date().toISOString()
  });
}));

router.put('/collaboration/comments/:commentId',
  createValidationMiddleware(Joi.object({
    comment: Joi.string().min(1).max(1000).required()
  })),
  asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;
    
    const result = await collaborationService.editComment(commentId, userId, comment);
    
    res.json({
      success: result.success,
      message: result.success ? 'Comment updated successfully' : 'Failed to update comment',
      timestamp: new Date().toISOString()
    });
  })
);

router.delete('/collaboration/comments/:commentId', asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?.id;
  
  const result = await collaborationService.deleteComment(commentId, userId);
  
  res.json({
    success: result.success,
    message: result.success ? 'Comment deleted successfully' : 'Failed to delete comment',
    timestamp: new Date().toISOString()
  });
}));

// Sharing endpoints
router.post('/collaboration/share',
  createValidationMiddleware(Joi.object({
    testCode: Joi.string().required(),
    userIds: Joi.array().items(Joi.string()).min(1).required(),
    permissions: Joi.object({
      canView: Joi.boolean().default(true),
      canComment: Joi.boolean().default(false),
      canEdit: Joi.boolean().default(false),
      canShare: Joi.boolean().default(false)
    }).optional()
  })),
  asyncHandler(async (req, res) => {
    const { testCode, userIds, permissions } = req.body;
    const ownerId = req.user?.id;
    
    const result = await collaborationService.shareTestWithUsers(
      testCode, 
      ownerId, 
      userIds, 
      permissions
    );
    
    res.status(result.success ? 201 : 400).json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  })
);

// Notifications endpoints
router.get('/notifications', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20 } = req.query;
  
  const result = await collaborationService.getUserNotifications(userId, parseInt(limit));
  
  res.json({
    success: result.success,
    data: result.notifications,
    timestamp: new Date().toISOString()
  });
}));

router.put('/notifications/:notificationId/read', asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user?.id;
  
  const result = await collaborationService.markNotificationAsRead(userId, notificationId);
  
  res.json({
    success: result.success,
    message: result.success ? 'Notification marked as read' : 'Failed to mark notification as read',
    timestamp: new Date().toISOString()
  });
}));

export default router;
