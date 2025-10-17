import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import axios from 'axios';

// Gmail API Integration
export class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async authenticate() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly']
    });
    return authUrl;
  }

  async setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  async searchEmails(testCode) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: `subject:"${testCode}" OR body:"${testCode}"`
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        return { found: false, placement: 'Not Found' };
      }

      // Get the first matching email
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: response.data.messages[0].id
      });

      // Check which folder/label the email is in
      const labels = message.data.labelIds;
      
      if (labels.includes('INBOX')) {
        return { found: true, placement: 'Inbox' };
      } else if (labels.includes('SPAM')) {
        return { found: true, placement: 'Spam' };
      } else if (labels.includes('CATEGORY_PROMOTIONS')) {
        return { found: true, placement: 'Promotions' };
      } else {
        return { found: true, placement: 'Other' };
      }
    } catch (error) {
      console.error('Gmail API error:', error);
      return { found: false, placement: 'Error', error: error.message };
    }
  }
}

// Microsoft Graph API Integration (Outlook)
export class OutlookService {
  constructor() {
    this.graphClient = Client.initWithMiddleware({
      authProvider: new OutlookAuthProvider()
    });
  }

  async authenticate() {
    // Microsoft Graph OAuth flow
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${process.env.OUTLOOK_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${process.env.OUTLOOK_REDIRECT_URI}&` +
      `scope=https://graph.microsoft.com/Mail.Read&` +
      `response_mode=query`;
    return authUrl;
  }

  async searchEmails(testCode) {
    try {
      const messages = await this.graphClient
        .me
        .messages
        .filter(`contains(subject,'${testCode}') or contains(body/content,'${testCode}')`)
        .get();

      if (!messages.value || messages.value.length === 0) {
        return { found: false, placement: 'Not Found' };
      }

      const message = messages.value[0];
      
      // Check folder based on message properties
      if (message.isRead === false && !message.categories?.includes('Junk')) {
        return { found: true, placement: 'Inbox' };
      } else if (message.categories?.includes('Junk')) {
        return { found: true, placement: 'Spam' };
      } else if (message.categories?.includes('Promotions')) {
        return { found: true, placement: 'Promotions' };
      } else {
        return { found: true, placement: 'Other' };
      }
    } catch (error) {
      console.error('Outlook API error:', error);
      return { found: false, placement: 'Error', error: error.message };
    }
  }
}

// Yahoo Mail API Integration
export class YahooService {
  constructor() {
    this.baseURL = 'https://api.mail.yahoo.com';
  }

  async authenticate() {
    const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?` +
      `client_id=${process.env.YAHOO_CLIENT_ID}&` +
      `redirect_uri=${process.env.YAHOO_REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=mail-r`;
    return authUrl;
  }

  async searchEmails(testCode, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          q: testCode
        }
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        return { found: false, placement: 'Not Found' };
      }

      const message = response.data.messages[0];
      
      // Determine placement based on folder
      if (message.folder === 'Inbox') {
        return { found: true, placement: 'Inbox' };
      } else if (message.folder === 'Spam') {
        return { found: true, placement: 'Spam' };
      } else if (message.folder === 'Promotions') {
        return { found: true, placement: 'Promotions' };
      } else {
        return { found: true, placement: 'Other' };
      }
    } catch (error) {
      console.error('Yahoo API error:', error);
      return { found: false, placement: 'Error', error: error.message };
    }
  }
}

// iCloud and ProtonMail services removed

// Custom Authentication Provider for Microsoft Graph
class OutlookAuthProvider {
  constructor() {
    this.accessToken = null;
  }

  async getAccessToken() {
    if (!this.accessToken) {
      throw new Error('Access token not available. Please authenticate first.');
    }
    return this.accessToken;
  }
}

// Main service orchestrator
export class MailboxAPIService {
  constructor() {
    this.gmail = new GmailService();
    this.outlook = new OutlookService();
    this.yahoo = new YahooService();
  }

  async checkAllInboxes(testCode, tokens = {}) {
    const results = await Promise.allSettled([
      this.checkGmail(testCode, tokens.gmail),
      this.checkOutlook(testCode, tokens.outlook),
      this.checkYahoo(testCode, tokens.yahoo)
    ]);

    return {
      Gmail: results[0].status === 'fulfilled' ? results[0].value : { found: false, placement: 'Error' },
      Outlook: results[1].status === 'fulfilled' ? results[1].value : { found: false, placement: 'Error' },
      Yahoo: results[2].status === 'fulfilled' ? results[2].value : { found: false, placement: 'Error' }
    };
  }

  async checkGmail(testCode, tokens) {
    if (tokens) {
      this.gmail.setCredentials(tokens);
    }
    return await this.gmail.searchEmails(testCode);
  }

  async checkOutlook(testCode, tokens) {
    if (tokens) {
      this.outlook.graphClient = Client.initWithMiddleware({
        authProvider: { getAccessToken: () => Promise.resolve(tokens.access_token) }
      });
    }
    return await this.outlook.searchEmails(testCode);
  }

  async checkYahoo(testCode, tokens) {
    return await this.yahoo.searchEmails(testCode, tokens?.access_token);
  }

}
