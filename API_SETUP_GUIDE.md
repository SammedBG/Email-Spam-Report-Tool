# API Setup Guide - Email Spam Report Tool

This guide explains how to set up the required API integrations for real email deliverability testing.

## 🔧 Required API Setups

### 1. Gmail API Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Gmail API**
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:5000/api/auth/gmail/callback`

4. **Add Environment Variables**
   ```bash
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback
   ```

### 2. Microsoft Graph API Setup (Outlook)

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com/
   - Navigate to "Azure Active Directory" > "App registrations"

2. **Register New Application**
   - Click "New registration"
   - Name: "Email Spam Report Tool"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:5000/api/auth/outlook/callback`

3. **Configure API Permissions**
   - Go to "API permissions"
   - Add permission: "Microsoft Graph" > "Mail.Read"
   - Grant admin consent

4. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value

5. **Add Environment Variables**
   ```bash
   OUTLOOK_CLIENT_ID=your_outlook_client_id
   OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
   OUTLOOK_REDIRECT_URI=http://localhost:5000/api/auth/outlook/callback
   ```

### 3. Yahoo Mail API Setup

1. **Go to Yahoo Developer Network**
   - Visit: https://developer.yahoo.com/
   - Create a new application

2. **Configure OAuth Settings**
   - Application type: "Web Application"
   - Redirect URI: `http://localhost:5000/api/auth/yahoo/callback`
   - Scopes: `mail-r` (read mail)

3. **Add Environment Variables**
   ```bash
   YAHOO_CLIENT_ID=your_yahoo_client_id
   YAHOO_CLIENT_SECRET=your_yahoo_client_secret
   YAHOO_REDIRECT_URI=http://localhost:5000/api/auth/yahoo/callback
   ```

### 4. iCloud Mail API Setup

1. **Go to Apple Developer Portal**
   - Visit: https://developer.apple.com/
   - Create a new app identifier

2. **Configure Sign in with Apple**
   - Enable "Sign in with Apple"
   - Configure domains and redirect URLs
   - Redirect URI: `http://localhost:5000/api/auth/icloud/callback`

3. **Add Environment Variables**
   ```bash
   ICLOUD_CLIENT_ID=your_icloud_client_id
   ICLOUD_CLIENT_SECRET=your_icloud_client_secret
   ICLOUD_REDIRECT_URI=http://localhost:5000/api/auth/icloud/callback
   ```

### 5. ProtonMail API Setup

1. **Go to ProtonMail Developer**
   - Visit: https://account.proton.me/developer
   - Create a new application

2. **Configure OAuth Settings**
   - Application type: "Web Application"
   - Redirect URI: `http://localhost:5000/api/auth/proton/callback`
   - Scopes: `mail:read`

3. **Add Environment Variables**
   ```bash
   PROTON_CLIENT_ID=your_proton_client_id
   PROTON_CLIENT_SECRET=your_proton_client_secret
   PROTON_REDIRECT_URI=http://localhost:5000/api/auth/proton/callback
   ```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual API credentials
nano .env
```

### 3. Start the Server
```bash
npm run dev
```

## 🔐 Authentication Flow

### Frontend Integration
The frontend needs to handle OAuth flows for each provider:

```javascript
// Example: Gmail authentication
const authenticateGmail = async () => {
  const response = await fetch('/api/auth/gmail');
  const { authUrl } = await response.json();
  window.location.href = authUrl;
};

// Handle callback
const handleCallback = async (code, provider) => {
  const response = await fetch(`/api/auth/${provider}/callback?code=${code}`);
  const { tokens } = await response.json();
  // Store tokens for later use
  localStorage.setItem(`${provider}_tokens`, JSON.stringify(tokens));
};
```

### Backend Token Management
The backend automatically manages token refresh and storage:

```javascript
// Check test with stored tokens
const checkTest = async (testCode, userEmail) => {
  const tokens = tokenManager.getAllTokens(userEmail);
  const results = await mailboxService.checkAllInboxes(testCode, tokens);
  return results;
};
```

## 🧪 Testing the Integration

### 1. Test OAuth Flows
```bash
# Test Gmail authentication
curl http://localhost:5000/api/auth/gmail

# Test Outlook authentication  
curl http://localhost:5000/api/auth/outlook
```

### 2. Test Email Detection
```bash
# Start a test
curl -X POST http://localhost:5000/api/start-test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check results (with tokens)
curl -X POST http://localhost:5000/api/check/TESTCODE \
  -H "Content-Type: application/json" \
  -d '{"tokens": {"gmail": {...}, "outlook": {...}}}'
```

## 🚨 Important Notes

### Security Considerations
- Never commit API credentials to version control
- Use environment variables for all sensitive data
- Implement proper token encryption in production
- Add rate limiting to prevent abuse

### Production Deployment
- Update redirect URIs for production domains
- Use HTTPS for all OAuth callbacks
- Implement proper error handling and logging
- Set up monitoring for API rate limits

### API Rate Limits
- Gmail API: 1 billion quota units per day
- Microsoft Graph: 10,000 requests per 10 minutes
- Yahoo API: 100 requests per hour
- iCloud API: 1000 requests per hour
- ProtonMail API: 100 requests per minute

## 🔧 Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**
   - Ensure redirect URIs match exactly in API console
   - Check for trailing slashes and HTTP vs HTTPS

2. **Scope Permissions**
   - Verify all required scopes are requested
   - Check if admin consent is required

3. **Token Expiration**
   - Implement automatic token refresh
   - Handle token expiration gracefully

4. **API Rate Limits**
   - Implement exponential backoff
   - Cache results when possible
   - Monitor usage and implement quotas

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=email-spam-report:*
NODE_ENV=development
```

## 📚 Additional Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Yahoo Mail API Documentation](https://developer.yahoo.com/mail/)
- [Apple Sign in Documentation](https://developer.apple.com/sign-in-with-apple/)
- [ProtonMail API Documentation](https://protonmail.com/developers/)
