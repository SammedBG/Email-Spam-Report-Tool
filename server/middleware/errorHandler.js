import { emailService } from '../services/emailService.js';

// Custom error classes
export class APIError extends Error {
  constructor(message, statusCode = 500, provider = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.provider = provider;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthenticationError extends Error {
  constructor(message, provider = null) {
    super(message);
    this.name = 'AuthenticationError';
    this.provider = provider;
    this.statusCode = 401;
    this.timestamp = new Date().toISOString();
  }
}

// Retry mechanism for API calls
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }
        
        if (attempt === this.maxRetries) {
          console.error(`❌ Operation failed after ${this.maxRetries} attempts:`, error);
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  shouldNotRetry(error) {
    // Don't retry authentication errors or validation errors
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return true;
    }
    
    // Don't retry 4xx client errors (except rate limiting)
    if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      return true;
    }
    
    return false;
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Rate limiting middleware
export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean every minute
  }

  isAllowed(identifier, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > oneHourAgo);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Input validation middleware
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message, error.details[0].path[0]);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Global error handler
export const globalErrorHandler = (err, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      field: err.field,
      timestamp: err.timestamp
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: err.message,
      provider: err.provider,
      timestamp: err.timestamp
    });
  }

  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: 'API Error',
      message: err.message,
      provider: err.provider,
      timestamp: err.timestamp
    });
  }

  // Handle rate limiting
  if (err.statusCode === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 60
    });
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      error: 'Database Error',
      message: 'A database error occurred. Please try again.',
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid.',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Authentication token has expired.',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check middleware
export const healthCheck = (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(health);
};

// Create singleton instances
export const retryManager = new RetryManager();
export const rateLimiter = new RateLimiter();
