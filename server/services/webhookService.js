import crypto from 'crypto';
import axios from 'axios';

export class WebhookService {
  constructor() {
    this.webhooks = new Map(); // In production, use database
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Register a webhook
  registerWebhook(userId, webhookData) {
    const webhookId = crypto.randomUUID();
    const webhook = {
      id: webhookId,
      userId,
      url: webhookData.url,
      events: webhookData.events || ['test.completed', 'test.failed'],
      secret: webhookData.secret || crypto.randomBytes(32).toString('hex'),
      isActive: true,
      createdAt: new Date(),
      lastTriggered: null,
      failureCount: 0
    };

    this.webhooks.set(webhookId, webhook);
    return webhook;
  }

  // Trigger webhook for an event
  async triggerWebhook(eventType, data, userId = null) {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook => {
      return webhook.isActive && 
             webhook.events.includes(eventType) &&
             (!userId || webhook.userId === userId);
    });

    const promises = matchingWebhooks.map(webhook => 
      this.sendWebhook(webhook, eventType, data)
    );

    await Promise.allSettled(promises);
  }

  // Send webhook request
  async sendWebhook(webhook, eventType, data) {
    try {
      const payload = {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
        webhookId: webhook.id
      };

      // Generate signature
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);

      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'User-Agent': 'EmailSpamReport-Webhook/1.0'
        },
        timeout: 10000 // 10 seconds
      });

      // Update webhook stats
      webhook.lastTriggered = new Date();
      webhook.failureCount = 0;

      console.log(`✅ Webhook sent successfully: ${webhook.url} - Event: ${eventType}`);
      return { success: true, status: response.status };
    } catch (error) {
      console.error(`❌ Webhook failed: ${webhook.url} - Event: ${eventType}`, error.message);
      
      // Update failure count
      webhook.failureCount++;
      
      // Add to retry queue if not exceeded max retries
      if (webhook.failureCount < this.maxRetries) {
        this.retryQueue.push({
          webhook,
          eventType,
          data,
          retryCount: webhook.failureCount,
          nextRetry: new Date(Date.now() + (this.retryDelay * Math.pow(2, webhook.failureCount)))
        });
      } else {
        // Deactivate webhook after max retries
        webhook.isActive = false;
        console.error(`🚫 Webhook deactivated after ${this.maxRetries} failures: ${webhook.url}`);
      }

      return { success: false, error: error.message };
    }
  }

  // Process retry queue
  async processRetryQueue() {
    const now = new Date();
    const readyToRetry = this.retryQueue.filter(item => item.nextRetry <= now);
    
    for (const item of readyToRetry) {
      await this.sendWebhook(item.webhook, item.eventType, item.data);
      
      // Remove from queue
      const index = this.retryQueue.indexOf(item);
      if (index > -1) {
        this.retryQueue.splice(index, 1);
      }
    }
  }

  // Generate webhook signature
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Verify webhook signature
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Get webhooks for a user
  getUserWebhooks(userId) {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.userId === userId)
      .map(webhook => ({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
        lastTriggered: webhook.lastTriggered,
        failureCount: webhook.failureCount
      }));
  }

  // Update webhook
  updateWebhook(webhookId, updates) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    Object.assign(webhook, updates);
    this.webhooks.set(webhookId, webhook);
    return webhook;
  }

  // Delete webhook
  deleteWebhook(webhookId) {
    return this.webhooks.delete(webhookId);
  }

  // Test webhook
  async testWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testData = {
      test: true,
      message: 'This is a test webhook from Email Spam Report Tool',
      timestamp: new Date().toISOString()
    };

    return await this.sendWebhook(webhook, 'webhook.test', testData);
  }

  // Get webhook statistics
  getWebhookStats() {
    const webhooks = Array.from(this.webhooks.values());
    const activeWebhooks = webhooks.filter(w => w.isActive);
    const failedWebhooks = webhooks.filter(w => w.failureCount > 0);
    const totalWebhooks = webhooks.length;

    return {
      totalWebhooks,
      activeWebhooks: activeWebhooks.length,
      failedWebhooks: failedWebhooks.length,
      retryQueueSize: this.retryQueue.length
    };
  }

  // Clean up old webhooks
  cleanupWebhooks() {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [webhookId, webhook] of this.webhooks.entries()) {
      if (webhook.createdAt < oneMonthAgo && !webhook.isActive) {
        this.webhooks.delete(webhookId);
      }
    }
  }
}

// Singleton instance
export const webhookService = new WebhookService();

// Process retry queue every 30 seconds
setInterval(() => {
  webhookService.processRetryQueue();
}, 30 * 1000);

// Cleanup old webhooks daily
setInterval(() => {
  webhookService.cleanupWebhooks();
}, 24 * 60 * 60 * 1000);
