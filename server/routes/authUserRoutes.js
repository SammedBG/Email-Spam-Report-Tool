import express from 'express';
import { User } from '../models/User.js';
import { asyncHandler, ValidationError, AuthenticationError } from '../middleware/errorHandler.js';
import { createValidationMiddleware } from '../middleware/validation.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  company: Joi.string().max(100).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  company: Joi.string().max(100).optional(),
  preferences: Joi.object({
    emailNotifications: Joi.object({
      reportReady: Joi.boolean().optional(),
      testStarted: Joi.boolean().optional(),
      weeklyDigest: Joi.boolean().optional(),
      marketing: Joi.boolean().optional()
    }).optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    timezone: Joi.string().optional()
  }).optional()
});

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid token or user not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired.'));
    } else {
      next(error);
    }
  }
};

// Register new user
router.post('/register', 
  createValidationMiddleware(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists.');
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      company
    });

    // Generate email verification token
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    await user.save();

    // Generate API key
    const apiKey = user.generateApiKey();
    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getProfile(),
        token,
        apiKey
      }
    });
  })
);

// Login user
router.post('/login',
  createValidationMiddleware(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated.');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate auth token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getProfile(),
        token
      }
    });
  })
);

// Get current user profile
router.get('/profile',
  authenticateUser,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user.getProfile()
      }
    });
  })
);

// Update user profile
router.put('/profile',
  authenticateUser,
  createValidationMiddleware(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body;
    
    // Update user fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        req.user[key] = updates[key];
      }
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user.getProfile()
      }
    });
  })
);

// Generate new API key
router.post('/api-key',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const apiKey = req.user.generateApiKey();
    await req.user.save();

    res.json({
      success: true,
      message: 'API key generated successfully',
      data: {
        apiKey
      }
    });
  })
);

// Get user's test history
router.get('/tests',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const { TestResult } = await import('../models/TestResult.js');
    
    const tests = await TestResult.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('code status score createdAt result tracking');

    const total = await TestResult.countDocuments({ userEmail: req.user.email });

    res.json({
      success: true,
      data: {
        tests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Get user statistics
router.get('/stats',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const { TestResult } = await import('../models/TestResult.js');
    
    const totalTests = await TestResult.countDocuments({ userEmail: req.user.email });
    const completedTests = await TestResult.countDocuments({ 
      userEmail: req.user.email, 
      status: 'completed' 
    });
    const failedTests = await TestResult.countDocuments({ 
      userEmail: req.user.email, 
      status: 'error' 
    });

    // Calculate average score
    const completedTestScores = await TestResult.find({ 
      userEmail: req.user.email, 
      status: 'completed' 
    }).select('score');
    
    const averageScore = completedTestScores.length > 0 
      ? Math.round(completedTestScores.reduce((sum, test) => sum + test.score, 0) / completedTestScores.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalTests,
        completedTests,
        failedTests,
        averageScore,
        successRate: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0
      }
    });
  })
);

// Change password
router.put('/password',
  authenticateUser,
  createValidationMiddleware(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect.');
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  })
);

// Delete account
router.delete('/account',
  authenticateUser,
  createValidationMiddleware(Joi.object({
    password: Joi.string().required()
  })),
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ValidationError('Password is incorrect.');
    }

    // Deactivate user instead of deleting
    req.user.isActive = false;
    await req.user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  })
);

export default router;
