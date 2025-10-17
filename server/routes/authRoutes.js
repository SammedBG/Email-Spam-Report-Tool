import express from 'express';
import { MailboxAPIService } from '../services/mailboxAPIs.js';

const router = express.Router();
const mailboxService = new MailboxAPIService();

// Gmail OAuth flow
router.get('/gmail', async (req, res) => {
  try {
    const authUrl = await mailboxService.gmail.authenticate();
    res.json({ authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Gmail authentication' });
  }
});

router.get('/gmail/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const { tokens } = await mailboxService.gmail.oauth2Client.getToken(code);
    mailboxService.gmail.setCredentials(tokens);

    res.json({ 
      success: true, 
      message: 'Gmail authentication successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.status(500).json({ error: 'Failed to complete Gmail authentication' });
  }
});

// Outlook OAuth flow
router.get('/outlook', async (req, res) => {
  try {
    const authUrl = await mailboxService.outlook.authenticate();
    res.json({ authUrl });
  } catch (error) {
    console.error('Outlook auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Outlook authentication' });
  }
});

router.get('/outlook/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Read'
      })
    });

    const tokens = await tokenResponse.json();
    
    res.json({ 
      success: true, 
      message: 'Outlook authentication successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      }
    });
  } catch (error) {
    console.error('Outlook callback error:', error);
    res.status(500).json({ error: 'Failed to complete Outlook authentication' });
  }
});

// Yahoo OAuth flow
router.get('/yahoo', async (req, res) => {
  try {
    const authUrl = await mailboxService.yahoo.authenticate();
    res.json({ authUrl });
  } catch (error) {
    console.error('Yahoo auth error:', error);
    res.status(500).json({ error: 'Failed to initiate Yahoo authentication' });
  }
});

router.get('/yahoo/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.YAHOO_CLIENT_ID,
        client_secret: process.env.YAHOO_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.YAHOO_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    
    res.json({ 
      success: true, 
      message: 'Yahoo authentication successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      }
    });
  } catch (error) {
    console.error('Yahoo callback error:', error);
    res.status(500).json({ error: 'Failed to complete Yahoo authentication' });
  }
});

// iCloud and ProtonMail OAuth flows removed

export default router;
