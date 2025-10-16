import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.service = process.env.EMAIL_SERVICE || 'sendgrid';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@emailspamreport.com';
    
    // Initialize based on service
    if (this.service === 'sendgrid') {
      this.initializeSendGrid();
    } else if (this.service === 'smtp') {
      this.initializeSMTP();
    }
  }

  initializeSendGrid() {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not found. Email notifications will be disabled.');
      return;
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid email service initialized');
  }

  initializeSMTP() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('✅ SMTP email service initialized');
  }

  // Send report notification email
  async sendReportNotification(userEmail, testCode, reportData) {
    try {
      const reportUrl = `${process.env.CLIENT_ORIGIN}/report/${testCode}`;
      const subject = `Your Email Deliverability Report is Ready - ${testCode}`;
      
      const htmlContent = this.generateReportEmailHTML(userEmail, testCode, reportData, reportUrl);
      const textContent = this.generateReportEmailText(userEmail, testCode, reportData, reportUrl);

      const emailData = {
        to: userEmail,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: textContent
      };

      if (this.service === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (this.service === 'smtp') {
        await this.transporter.sendMail(emailData);
      }

      console.log(`✅ Report notification sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send report notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send test started notification
  async sendTestStartedNotification(userEmail, testCode, instructions) {
    try {
      const subject = `Email Deliverability Test Started - ${testCode}`;
      
      const htmlContent = this.generateTestStartedEmailHTML(userEmail, testCode, instructions);
      const textContent = this.generateTestStartedEmailText(userEmail, testCode, instructions);

      const emailData = {
        to: userEmail,
        from: this.fromEmail,
        subject,
        html: htmlContent,
        text: textContent
      };

      if (this.service === 'sendgrid') {
        await sgMail.send(emailData);
      } else if (this.service === 'smtp') {
        await this.transporter.sendMail(emailData);
      }

      console.log(`✅ Test started notification sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send test started notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate HTML email template for report
  generateReportEmailHTML(userEmail, testCode, reportData, reportUrl) {
    const scoreColor = reportData.score >= 80 ? '#10b981' : reportData.score >= 60 ? '#f59e0b' : '#ef4444';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Deliverability Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .score { font-size: 48px; font-weight: bold; color: ${scoreColor}; text-align: center; margin: 20px 0; }
          .provider-result { display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: white; border-radius: 6px; border-left: 4px solid #e2e8f0; }
          .provider-result.inbox { border-left-color: #10b981; }
          .provider-result.promotions { border-left-color: #f59e0b; }
          .provider-result.spam { border-left-color: #ef4444; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Email Deliverability Report</h1>
            <p>Your test results are ready!</p>
          </div>
          
          <div class="content">
            <h2>Overall Deliverability Score</h2>
            <div class="score">${reportData.score}%</div>
            
            <h3>Provider Results</h3>
            ${reportData.result.map(r => `
              <div class="provider-result ${r.placement.toLowerCase()}">
                <strong>${r.provider}</strong>
                <span>${r.placement}</span>
              </div>
            `).join('')}
            
            <div style="text-align: center;">
              <a href="${reportUrl}" class="btn">View Full Report</a>
            </div>
            
            <div class="footer">
              <p>Test Code: <code>${testCode}</code></p>
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>This report was generated using real mailbox API integrations.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text email template for report
  generateReportEmailText(userEmail, testCode, reportData, reportUrl) {
    return `
Email Deliverability Report

Your test results are ready!

Overall Deliverability Score: ${reportData.score}%

Provider Results:
${reportData.result.map(r => `- ${r.provider}: ${r.placement}`).join('\n')}

View Full Report: ${reportUrl}

Test Code: ${testCode}
Generated on: ${new Date().toLocaleString()}

This report was generated using real mailbox API integrations.
    `.trim();
  }

  // Generate HTML email template for test started
  generateTestStartedEmailHTML(userEmail, testCode, instructions) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Deliverability Test Started</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          .instructions { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .inbox-list { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Email Deliverability Test Started</h1>
            <p>Your test is ready to begin!</p>
          </div>
          
          <div class="content">
            <h2>Your Test Code</h2>
            <div class="code">${testCode}</div>
            
            <div class="instructions">
              <h3>📧 Send Your Test Email</h3>
              <p><strong>Subject:</strong> ${instructions.subject}</p>
              <p><strong>Body:</strong> ${instructions.body}</p>
            </div>
            
            <div class="inbox-list">
              <h3>📬 Send to these addresses:</h3>
              <ul>
                ${instructions.sendTo.map(i => `<li><strong>${i.provider}:</strong> ${i.address}</li>`).join('')}
              </ul>
            </div>
            
            <div class="footer">
              <p>After sending your email, return to the app to check results.</p>
              <p>Test Code: <code>${testCode}</code></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text email template for test started
  generateTestStartedEmailText(userEmail, testCode, instructions) {
    return `
Email Deliverability Test Started

Your test is ready to begin!

Test Code: ${testCode}

Send Your Test Email:
Subject: ${instructions.subject}
Body: ${instructions.body}

Send to these addresses:
${instructions.sendTo.map(i => `- ${i.provider}: ${i.address}`).join('\n')}

After sending your email, return to the app to check results.

Test Code: ${testCode}
    `.trim();
  }

  // Test email service configuration
  async testConfiguration() {
    try {
      const testEmail = {
        to: 'test@example.com',
        from: this.fromEmail,
        subject: 'Email Service Test',
        text: 'This is a test email to verify email service configuration.',
        html: '<p>This is a test email to verify email service configuration.</p>'
      };

      if (this.service === 'sendgrid') {
        await sgMail.send(testEmail);
      } else if (this.service === 'smtp') {
        await this.transporter.sendMail(testEmail);
      }

      return { success: true, message: 'Email service configuration is working' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
