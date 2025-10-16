import express from 'express';
import { webhookService } from '../services/webhookService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createValidationMiddleware } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createWebhookSchema = Joi.object({
  url: Joi.string().uri().required(),
  events: Joi.array().items(
    Joi.string().valid('test.completed', 'test.failed', 'user.authenticated', 'webhook.test')
  ).min(1).required(),
  secret: Joi.string().optional()
});

const updateWebhookSchema = Joi.object({
  url: Joi.string().uri().optional(),
  events: Joi.array().items(
    Joi.string().valid('test.completed', 'test.failed', 'user.authenticated', 'webhook.test')
  ).optional(),
  isActive: Joi.boolean().optional()
});

// Create webhook
router.post('/',
  createValidationMiddleware(createWebhookSchema),
  asyncHandler(async (req, res) => {
    const { url, events, secret } = req.body;
    const userId = req.user?.id; // Assuming user is authenticated
    
    const webhook = webhookService.registerWebhook(userId, {
      url,
      events,
      secret
    });
    
    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt
      }
    });
  })
);

// Get user's webhooks
router.get('/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    
    const webhooks = webhookService.getUserWebhooks(userId);
    
    res.json({
      success: true,
      data: webhooks,
      timestamp: new Date().toISOString()
    });
  })
);

// Get webhook by ID
router.get('/:webhookId',
  asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const userId = req.user?.id;
    
    const webhooks = webhookService.getUserWebhooks(userId);
    const webhook = webhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }
    
    res.json({
      success: true,
      data: webhook,
      timestamp: new Date().toISOString()
    });
  })
);

// Update webhook
router.put('/:webhookId',
  createValidationMiddleware(updateWebhookSchema),
  asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const updates = req.body;
    const userId = req.user?.id;
    
    // Verify webhook belongs to user
    const userWebhooks = webhookService.getUserWebhooks(userId);
    const webhook = userWebhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }
    
    const updatedWebhook = webhookService.updateWebhook(webhookId, updates);
    
    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: {
        id: updatedWebhook.id,
        url: updatedWebhook.url,
        events: updatedWebhook.events,
        isActive: updatedWebhook.isActive
      }
    });
  })
);

// Delete webhook
router.delete('/:webhookId',
  asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const userId = req.user?.id;
    
    // Verify webhook belongs to user
    const userWebhooks = webhookService.getUserWebhooks(userId);
    const webhook = userWebhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }
    
    const deleted = webhookService.deleteWebhook(webhookId);
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully',
      data: { deleted }
    });
  })
);

// Test webhook
router.post('/:webhookId/test',
  asyncHandler(async (req, res) => {
    const { webhookId } = req.params;
    const userId = req.user?.id;
    
    // Verify webhook belongs to user
    const userWebhooks = webhookService.getUserWebhooks(userId);
    const webhook = userWebhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }
    
    const result = await webhookService.testWebhook(webhookId);
    
    res.json({
      success: result.success,
      message: result.success ? 'Webhook test successful' : 'Webhook test failed',
      data: result
    });
  })
);

// Get webhook statistics
router.get('/stats/overview',
  asyncHandler(async (req, res) => {
    const stats = webhookService.getWebhookStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
