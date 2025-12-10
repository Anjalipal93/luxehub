const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.authMethod = null;
    this.oauth2Client = null;
    // Initialize synchronously first, OAuth2 will be set up on first use
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check for OAuth2 credentials first (Google OAuth2)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_REFRESH_TOKEN && process.env.SMTP_USER) {
      try {
        // Set up OAuth2 client for token refresh
        this.oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );

        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Initialize transporter with OAuth2 callback for automatic token refresh
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.SMTP_USER,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: '', // Will be set by callback
            expires: 0
          }
        });

        // Set up automatic token refresh callback
        this.transporter.set('oauth2_provision_cb', async (user, renew, callback) => {
          try {
            const { token } = await this.oauth2Client.getAccessToken();
            callback(null, token);
          } catch (error) {
            console.error('OAuth2 token refresh error:', error);
            callback(error);
          }
        });

        this.isConfigured = true;
        this.authMethod = 'oauth2';
        console.log('Email service configured with Google OAuth2');
      } catch (error) {
        console.error('Failed to initialize OAuth2 transporter:', error);
        // Fall back to SMTP if OAuth2 fails
        this.initializeSMTP();
      }
    } 
    // Fall back to SMTP (App Password method)
    else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initializeSMTP();
    } else {
      console.warn('Email service not configured. Missing email credentials in environment variables.');
      this.isConfigured = false;
    }
  }


  initializeSMTP() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });
      this.isConfigured = true;
      this.authMethod = 'smtp';
      console.log('Email service configured with SMTP (App Password)');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      this.isConfigured = false;
    }
  }


  async sendEmail(to, subject, text, html) {
    try {
      if (!this.isConfigured || !this.transporter) {
        const missing = [];
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
          // OAuth2 method
          if (!process.env.GOOGLE_REFRESH_TOKEN) missing.push('GOOGLE_REFRESH_TOKEN');
          if (!process.env.SMTP_USER) missing.push('SMTP_USER');
        } else {
          // SMTP method
          if (!process.env.SMTP_USER) missing.push('SMTP_USER');
          if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
        }
        
        return { 
          success: false, 
          error: 'Email service not configured',
          message: `Missing configuration: ${missing.join(', ')}. Please configure email settings in backend/.env file.`,
          code: 'NOT_CONFIGURED'
        };
      }

      // OAuth2 tokens are refreshed automatically by nodemailer via the callback

      // Validate email address
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return {
          success: false,
          error: 'Invalid email address',
          message: `Invalid email format: ${to}`,
          code: 'INVALID_EMAIL'
        };
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'AI Business Hub'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || html?.replace(/<[^>]*>/g, '') || '',
        html: html || `<p>${text}</p>`
      };

      console.log(`Attempting to send email to ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully. MessageId: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response,
        details: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Email send error:', error);
      
      let errorMessage = error.message || 'Unknown error';
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails = '';

      if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication failed';
        errorCode = 'AUTH_FAILED';
        errorDetails = 'Invalid SMTP username or password. Check your SMTP_USER and SMTP_PASS in .env file.';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = 'SMTP connection failed';
        errorCode = 'CONNECTION_FAILED';
        errorDetails = `Cannot connect to SMTP server ${process.env.SMTP_HOST || 'smtp.gmail.com'}. Check your network and SMTP settings.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'SMTP connection timeout';
        errorCode = 'TIMEOUT';
        errorDetails = 'SMTP server did not respond in time. Check your SMTP_HOST and SMTP_PORT settings.';
      }

      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails || error.message,
        code: errorCode,
        smtpError: {
          code: error.code,
          command: error.command,
          response: error.response
        }
      };
    }
  }

  async sendLowStockAlert(product, adminEmail) {
    const subject = `Low Stock Alert: ${product.name}`;
    const text = `Product ${product.name} is running low. Current stock: ${product.quantity}, Minimum threshold: ${product.minThreshold}`;
    const html = `
      <h2>Low Stock Alert</h2>
      <p><strong>Product:</strong> ${product.name}</p>
      <p><strong>Current Stock:</strong> ${product.quantity}</p>
      <p><strong>Minimum Threshold:</strong> ${product.minThreshold}</p>
      <p>Please consider restocking this product soon.</p>
    `;

    return await this.sendEmail(adminEmail, subject, text, html);
  }

  async sendSaleNotification(sale, adminEmail) {
    const subject = `New Sale Recorded: $${sale.totalAmount.toFixed(2)}`;
    const text = `A new sale of $${sale.totalAmount.toFixed(2)} has been recorded.`;
    const html = `
      <h2>New Sale Recorded</h2>
      <p><strong>Total Amount:</strong> $${sale.totalAmount.toFixed(2)}</p>
      <p><strong>Items:</strong> ${sale.items.length}</p>
      <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>
    `;

    return await this.sendEmail(adminEmail, subject, text, html);
  }
}

module.exports = new EmailService();

