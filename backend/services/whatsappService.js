const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConfigured = false;

    // Check if all required credentials are present
  const hasAccountSid =
  typeof process.env.TWILIO_ACCOUNT_SID === 'string' &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC');

const hasAuthToken =
  typeof process.env.TWILIO_AUTH_TOKEN === 'string' &&
  process.env.TWILIO_AUTH_TOKEN.length > 0;

const hasWhatsAppNumber =
  typeof process.env.TWILIO_WHATSAPP_NUMBER === 'string' &&
  process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:');


    if (hasAccountSid && hasAuthToken && hasWhatsAppNumber) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.isConfigured = true;
    }

    // Log missing vars on startup (safe - no secrets)
    if (!this.isConfigured) {
      const missing = [];
      if (!hasAccountSid) missing.push('TWILIO_ACCOUNT_SID');
      if (!hasAuthToken) missing.push('TWILIO_AUTH_TOKEN');
      if (!hasWhatsAppNumber) missing.push('TWILIO_WHATSAPP_NUMBER');
      console.log(`[WhatsAppService] WhatsApp not configured. Missing: ${missing.join(', ')}`);
    } else {
      console.log('[WhatsAppService] WhatsApp service configured and ready');
    }
  }

  async sendMessage(to, message) {
    // Check configuration - all three vars required
    const missing = [];
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (!process.env.TWILIO_WHATSAPP_NUMBER) missing.push('TWILIO_WHATSAPP_NUMBER');

    if (missing.length > 0 || !this.isConfigured || !this.client) {
      return {
        success: false,
        code: 'WHATSAPP_NOT_CONFIGURED',
        message: 'WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_NUMBER to backend/.env',
        missing: missing.length > 0 ? missing : ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'],
        setupUrl: 'https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn'
      };
    }

    try {
      // Validate input
      if (!to || typeof to !== 'string' || !to.trim()) {
        return {
          success: false,
          code: 'INVALID_PHONE',
          message: 'Invalid phone number format'
        };
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return {
          success: false,
          code: 'INVALID_MESSAGE',
          message: 'Message content is required'
        };
      }

      // Format phone number: strip non-digits, then add whatsapp:+ prefix
      // Allow input with or without +, extract digits only
      const digitsOnly = to.trim().replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return {
          success: false,
          code: 'INVALID_PHONE',
          message: 'Phone number must contain at least 10 digits'
        };
      }

      const formattedTo = `whatsapp:+${digitsOnly}`;
      const from = process.env.TWILIO_WHATSAPP_NUMBER; // Required, no default

      console.log(`[WhatsAppService] Sending: FROM ${from} TO ${formattedTo}`);

      const result = await this.client.messages.create({
        from,
        to: formattedTo,
        body: message.trim()
      });

      return {
        success: true,
        code: 'OK',
        sid: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('[WhatsAppService] Send error:', error);
      
      // Handle specific Twilio errors
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = error.message || 'Failed to send WhatsApp message';

      if (error.code === 21211) {
        errorCode = 'INVALID_PHONE';
        errorMessage = 'Invalid phone number format. Use format: +1234567890';
      } else if (error.code === 21608) {
        errorCode = 'UNVERIFIED_NUMBER';
        errorMessage = 'This phone number is not verified in Twilio sandbox. Recipient must join the sandbox first.';
      } else if (error.status === 401) {
        errorCode = 'AUTH_FAILED';
        errorMessage = 'Twilio authentication failed. Check your credentials.';
      }

      return {
        success: false,
        code: errorCode,
        message: errorMessage,
        twilioError: {
          code: error.code,
          status: error.status
        }
      };
    }
  }
}

module.exports = new WhatsAppService();
