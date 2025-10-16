import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'premium'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  preferences: {
    emailNotifications: {
      reportReady: { type: Boolean, default: true },
      testStarted: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  rateLimit: {
    requests: { type: Number, default: 100 },
    windowMs: { type: Number, default: 60000 } // 1 minute
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate API key
UserSchema.methods.generateApiKey = function() {
  const apiKey = require('crypto').randomBytes(32).toString('hex');
  this.apiKey = apiKey;
  return apiKey;
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Get user profile (without sensitive data)
UserSchema.methods.getProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

// Check if user can perform action based on rate limit
UserSchema.methods.checkRateLimit = function() {
  // This would be implemented with Redis in production
  // For now, return true (no rate limiting per user)
  return true;
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by API key
UserSchema.statics.findByApiKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ apiKey: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.plan': 1 });

export const User = mongoose.model('User', UserSchema);
