import Joi from 'joi';

// Email validation schema
export const emailSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Test code validation schema
export const testCodeSchema = Joi.object({
  code: Joi.string()
    .pattern(/^[a-z0-9]{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Test code must be 8 characters long and contain only lowercase letters and numbers',
      'any.required': 'Test code is required'
    })
});

// OAuth tokens validation schema
export const tokensSchema = Joi.object({
  tokens: Joi.object({
    gmail: Joi.object({
      access_token: Joi.string().required(),
      refresh_token: Joi.string().optional(),
      expiry_date: Joi.number().optional()
    }).optional(),
    outlook: Joi.object({
      access_token: Joi.string().required(),
      refresh_token: Joi.string().optional(),
      expires_in: Joi.number().optional()
    }).optional(),
    yahoo: Joi.object({
      access_token: Joi.string().required(),
      refresh_token: Joi.string().optional(),
      expires_in: Joi.number().optional()
    }).optional(),
    icloud: Joi.object({
      access_token: Joi.string().required(),
      refresh_token: Joi.string().optional(),
      expires_in: Joi.number().optional()
    }).optional(),
    proton: Joi.object({
      access_token: Joi.string().required(),
      refresh_token: Joi.string().optional(),
      expires_in: Joi.number().optional()
    }).optional()
  }).optional()
});

// Check test request validation
export const checkTestSchema = Joi.object({
  tokens: Joi.object().optional()
});

// Rate limiting validation
export const rateLimitSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  windowMs: Joi.number().integer().min(1000).max(3600000).default(60000)
});

// Email notification preferences
export const notificationSchema = Joi.object({
  email: Joi.string().email().required(),
  preferences: Joi.object({
    reportReady: Joi.boolean().default(true),
    testStarted: Joi.boolean().default(true),
    weeklyDigest: Joi.boolean().default(false)
  }).optional()
});

// API key validation
export const apiKeySchema = Joi.object({
  apiKey: Joi.string()
    .pattern(/^[a-zA-Z0-9]{32,}$/)
    .required()
    .messages({
      'string.pattern.base': 'API key must be at least 32 characters long and contain only alphanumeric characters',
      'any.required': 'API key is required'
    })
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', 'score', 'status').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// Search validation
export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).optional(),
  status: Joi.string().valid('pending', 'processing', 'completed', 'error').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

// Webhook validation
export const webhookSchema = Joi.object({
  event: Joi.string().valid('test.completed', 'test.failed', 'user.authenticated').required(),
  data: Joi.object().required(),
  timestamp: Joi.date().required(),
  signature: Joi.string().optional()
});

// File upload validation
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('text/csv', 'application/json').required(),
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB max
  }).required()
});

// Configuration validation
export const configSchema = Joi.object({
  emailService: Joi.string().valid('sendgrid', 'smtp', 'mailgun').default('sendgrid'),
  maxRetries: Joi.number().integer().min(1).max(10).default(3),
  timeout: Joi.number().integer().min(1000).max(30000).default(10000),
  rateLimit: Joi.object({
    windowMs: Joi.number().integer().min(1000).max(3600000).default(60000),
    max: Joi.number().integer().min(1).max(1000).default(100)
  }).optional()
});

// Custom validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTestCode = (code) => {
  const codeRegex = /^[a-z0-9]{8}$/;
  return codeRegex.test(code);
};

export const validateProvider = (provider) => {
  const validProviders = ['gmail', 'outlook', 'yahoo', 'icloud', 'proton'];
  return validProviders.includes(provider.toLowerCase());
};

export const validatePlacement = (placement) => {
  const validPlacements = ['Inbox', 'Spam', 'Promotions', 'Not Found', 'Error'];
  return validPlacements.includes(placement);
};

// Sanitization functions
export const sanitizeEmail = (email) => {
  return email.trim().toLowerCase();
};

export const sanitizeTestCode = (code) => {
  return code.trim().toLowerCase();
};

export const sanitizeString = (str, maxLength = 100) => {
  return str.trim().substring(0, maxLength);
};

// Validation middleware factory
export const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    req.body = value;
    next();
  };
};

// Query parameter validation
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: 'Query Validation Error',
        message: 'Invalid query parameters',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    req.query = value;
    next();
  };
};
