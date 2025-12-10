const express = require('express');
const twilio = require('twilio');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Secure Twilio Credentials
const accountSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

// Initialize Twilio client
let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
  console.log('[SMS Service] Twilio SMS service initialized');
} else {
  console.log('[SMS Service] Twilio credentials not found. SMS service disabled.');
}

// API Route for sending SMS
router.post('/sendsms', auth, [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required').isLength({ max: 160 }).withMessage('Message must be 160 characters or less'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'SMS service is not configured. Please add TWILIO_SID, TWILIO_TOKEN and TWILIO_NUMBER to .env',
      });
    }

    const { phone, message } = req.body;

    // Format phone number (ensure it starts with +)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    client.messages
      .create({
        body: message,
        from: twilioNumber,
        to: formattedPhone,
      })
      .then((message) => {
        console.log('[SMS Service] SMS sent successfully:', message.sid);
        res.json({
          success: true,
          message: 'SMS sent successfully!',
          sid: message.sid,
        });
      })
      .catch((err) => {
        console.error('[SMS Service] SMS send error:', err.message);
        res.status(500).json({
          success: false,
          message: 'Error sending SMS: ' + err.message,
        });
      });
  } catch (error) {
    console.error('[SMS Service] Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending SMS',
    });
  }
});

module.exports = router;

