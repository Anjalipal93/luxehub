const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

let client = null;

function getTwilioClient() {
  if (client) return client;

  const accountSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN;

  if (
    typeof accountSid !== 'string' ||
    !accountSid.startsWith('AC') ||
    typeof authToken !== 'string'
  ) {
    return null;
  }

  const twilio = require('twilio');
  client = twilio(accountSid, authToken);
  console.log('[SMS Service] Twilio client initialized');
  return client;
}

// API Route for sending SMS
router.post(
  '/sendsms',
  auth,
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 160 })
      .withMessage('Message must be 160 characters or less'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const client = getTwilioClient();
      if (!client) {
        return res.status(200).json({
          success: false,
          code: 'SMS_NOT_CONFIGURED',
          message:
            'SMS service is not configured. Add valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER.',
        });
      }

      const { phone, message } = req.body;
      const from = process.env.TWILIO_NUMBER;

      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const result = await client.messages.create({
        body: message,
        from,
        to: formattedPhone,
      });

      return res.json({
        success: true,
        message: 'SMS sent successfully',
        sid: result.sid,
      });
    } catch (error) {
      console.error('[SMS Service] Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Server error while sending SMS',
      });
    }
  }
);

module.exports = router;
