import jwt from 'jsonwebtoken';
import { TestResult } from '../models/TestResult.js';

// Token storage in memory (in production, use Redis or database)
const tokenStore = new Map();

export class TokenManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Store OAuth tokens for a user
  storeTokens(userEmail, provider, tokens) {
    const key = `${userEmail}:${provider}`;
    tokenStore.set(key, {
      ...tokens,
      storedAt: new Date(),
      expiresAt: new Date(Date.now() + (tokens.expires_in * 1000))
    });
  }

  // Get stored tokens for a user
  getTokens(userEmail, provider) {
    const key = `${userEmail}:${provider}`;
    const tokenData = tokenStore.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      tokenStore.delete(key);
      return null;
    }

    return tokenData;
  }

  // Get all tokens for a user
  getAllTokens(userEmail) {
    const tokens = {};
    const providers = ['gmail', 'outlook', 'yahoo', 'icloud', 'proton'];
    
    providers.forEach(provider => {
      const tokenData = this.getTokens(userEmail, provider);
      if (tokenData) {
        tokens[provider] = tokenData;
      }
    });

    return tokens;
  }

  // Generate JWT for API authentication
  generateJWT(userEmail) {
    return jwt.sign(
      { userEmail, timestamp: Date.now() },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  // Verify JWT
  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  // Refresh expired tokens
  async refreshToken(userEmail, provider, refreshToken) {
    try {
      let tokenEndpoint;
      let clientId, clientSecret;

      switch (provider) {
        case 'gmail':
          tokenEndpoint = 'https://oauth2.googleapis.com/token';
          clientId = process.env.GMAIL_CLIENT_ID;
          clientSecret = process.env.GMAIL_CLIENT_SECRET;
          break;
        case 'outlook':
          tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
          clientId = process.env.OUTLOOK_CLIENT_ID;
          clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
          break;
        case 'yahoo':
          tokenEndpoint = 'https://api.login.yahoo.com/oauth2/get_token';
          clientId = process.env.YAHOO_CLIENT_ID;
          clientSecret = process.env.YAHOO_CLIENT_SECRET;
          break;
        case 'icloud':
          tokenEndpoint = 'https://idmsa.apple.com/appleauth/token';
          clientId = process.env.ICLOUD_CLIENT_ID;
          clientSecret = process.env.ICLOUD_CLIENT_SECRET;
          break;
        case 'proton':
          tokenEndpoint = 'https://account.proton.me/oauth/token';
          clientId = process.env.PROTON_CLIENT_ID;
          clientSecret = process.env.PROTON_CLIENT_SECRET;
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const newTokens = await response.json();
      this.storeTokens(userEmail, provider, newTokens);
      return newTokens;
    } catch (error) {
      console.error(`Token refresh error for ${provider}:`, error);
      return null;
    }
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [key, tokenData] of tokenStore.entries()) {
      if (now > tokenData.expiresAt) {
        tokenStore.delete(key);
      }
    }
  }

  // Get token status for a user
  getTokenStatus(userEmail) {
    const providers = ['gmail', 'outlook', 'yahoo', 'icloud', 'proton'];
    const status = {};

    providers.forEach(provider => {
      const tokenData = this.getTokens(userEmail, provider);
      status[provider] = {
        authenticated: !!tokenData,
        expiresAt: tokenData?.expiresAt,
        needsRefresh: tokenData ? new Date() > new Date(tokenData.expiresAt.getTime() - 300000) : false // 5 minutes before expiry
      };
    });

    return status;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();

// Cleanup expired tokens every hour
setInterval(() => {
  tokenManager.cleanupExpiredTokens();
}, 60 * 60 * 1000);
