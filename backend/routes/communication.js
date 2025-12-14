const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');
// let whatsappService = null;

// function getWhatsAppService() {
//   if (!whatsappService) {
//     whatsappService = require('../services/whatsappService');
//   }
//   return whatsappService;
// }


const router = express.Router();

// @route   GET /api/communication/messages
// @desc    Get all messages
// @access  Private
router.get('/messages', auth, async (req, res) => {
  try {
    const { channel, status } = req.query;
    const query = {};

    if (channel) query.channel = channel;
    if (status) query.status = status;

    const messages = await Message.find(query)
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communication/email-status
// @desc    Check email service configuration status
// @access  Private
router.get('/email-status', auth, async (req, res) => {
  try {
    const hasOAuth2 = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
                         process.env.GOOGLE_REFRESH_TOKEN && process.env.SMTP_USER);
    const hasSMTP = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    const isConfigured = hasOAuth2 || hasSMTP;
    
    const missingConfig = [];
    let authMethod = null;
    
    if (hasOAuth2) {
      authMethod = 'OAuth2 (Google)';
      if (!process.env.GOOGLE_CLIENT_ID) missingConfig.push('GOOGLE_CLIENT_ID');
      if (!process.env.GOOGLE_CLIENT_SECRET) missingConfig.push('GOOGLE_CLIENT_SECRET');
      if (!process.env.GOOGLE_REFRESH_TOKEN) missingConfig.push('GOOGLE_REFRESH_TOKEN');
      if (!process.env.SMTP_USER) missingConfig.push('SMTP_USER');
    } else if (hasSMTP) {
      authMethod = 'SMTP (App Password)';
      if (!process.env.SMTP_USER) missingConfig.push('SMTP_USER');
      if (!process.env.SMTP_PASS) missingConfig.push('SMTP_PASS');
    } else {
      missingConfig.push('SMTP_USER, SMTP_PASS (or GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)');
    }

    res.json({
      configured: isConfigured,
      authMethod: authMethod || 'None',
      missingConfig,
      email: process.env.SMTP_USER || 'Not set',
      message: isConfigured 
        ? `Email service is configured with ${authMethod} and ready to use`
        : `Email service is not configured. Missing: ${missingConfig.join(', ')}`
    });
  } catch (error) {
    console.error('Email status check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communication/whatsapp-status
// @desc    Check WhatsApp service configuration status
// @access  Private
router.get('/whatsapp-status', auth, async (req, res) => {
  try {
    const missing = [];
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (!process.env.TWILIO_WHATSAPP_NUMBER) missing.push('TWILIO_WHATSAPP_NUMBER');

    const isConfigured = missing.length === 0;

    if (isConfigured) {
      res.json({
        configured: true
      });
    } else {
      res.json({
        configured: false,
        details: {
          code: 'WHATSAPP_NOT_CONFIGURED',
          missing: missing,
          setupUrl: 'https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn'
        }
      });
    }
  } catch (error) {
    console.error('WhatsApp status check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communication/send-email
// @desc    Send email (single or group)
// @access  Private
router.post('/send-email', auth, [
  body('to').custom((value) => {
    if (Array.isArray(value)) {
      return value.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }).withMessage('Valid email(s) required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, subject, content } = req.body;
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];
    const messages = [];

    // Send to all recipients
    for (const recipient of recipients) {
      const result = await emailService.sendEmail(recipient, subject, content, `<p>${content}</p>`);
      
      // Save message to database
      const message = new Message({
        channel: 'email',
        from: req.user.email,
        to: recipient,
        subject,
        content,
        status: result.success ? 'sent' : 'failed',
        sentBy: req.user._id,
        ownerId: req.user.ownerId || req.user._id,
        metadata: result
      });

      await message.save();
      messages.push(message);
      results.push({ 
        recipient, 
        success: result.success,
        error: result.error,
        message: result.message,
        details: result.details,
        code: result.code
      });
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-message', {
        channel: 'email',
        from: req.user.email,
        recipients: recipients.length,
        subject,
        timestamp: new Date()
      });
    }

    const allSuccess = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    const failedResults = results.filter(r => !r.success);
    
    res.json({ 
      success: allSuccess, 
      messages,
      results,
      totalSent: recipients.length,
      successCount,
      failedCount,
      errors: failedResults.map(r => ({
        recipient: r.recipient,
        error: r.error || 'Unknown error',
        message: r.message || '',
        details: r.details || '',
        code: r.code || 'UNKNOWN'
      }))
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communication/send-whatsapp
// @desc    Send WhatsApp message (single or group)
// @access  Private
router.post('/send-whatsapp', auth, [
  body('to').custom((value) => {
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(phone => phone && phone.trim().length > 0);
    }
    return value && value.trim().length > 0;
  }).withMessage('Phone number(s) required'),
  body('message').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, message } = req.body;
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];
    const messages = [];

    // Send to all recipients
    for (const recipient of recipients) {
      const result = await whatsappService.sendMessage(recipient, message);
      
      // If service is not configured, return immediately
      if (result.code === 'WHATSAPP_NOT_CONFIGURED') {
        return res.status(200).json(result);
      }
      
      // Save message to database
      const messageDoc = new Message({
        channel: 'whatsapp',
        from: req.user.phone || 'system',
        to: recipient,
        content: message,
        status: result.success ? 'sent' : 'failed',
        sentBy: req.user._id,
        ownerId: req.user.ownerId || req.user._id,
        metadata: result
      });

      await messageDoc.save();
      messages.push(messageDoc);
      results.push({ 
        recipient, 
        success: result.success,
        error: result.message,
        code: result.code,
        details: result.twilioError || result.message
      });
    }

    // Emit real-time notification only if at least one message was sent
    if (results.some(r => r.success)) {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-message', {
          channel: 'whatsapp',
          from: req.user.name,
          recipients: recipients.length,
          timestamp: new Date()
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    // Return service response format directly
    if (results.length === 1) {
      // Single recipient - return service response directly
      const result = results[0];
      if (result.success) {
        return res.status(200).json({
          success: true,
          code: 'OK',
          sid: messages[0]?.metadata?.sid,
          status: messages[0]?.metadata?.status
        });
      } else {
        return res.status(200).json({
          success: false,
          code: result.code,
          message: result.error
        });
      }
    } else {
      // Multiple recipients - return summary
      return res.status(200).json({ 
        success: allSuccess, 
        messages,
        results,
        totalSent: recipients.length,
        successCount: results.filter(r => r.success).length,
        failedCount: failedResults.length,
        errors: failedResults.map(r => ({
          recipient: r.recipient,
          error: r.error || 'Unknown error',
          details: r.details || '',
          code: r.code || 'UNKNOWN'
        }))
      });
    }
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communication/customers
// @desc    Get customer list from sales
// @access  Private
router.get('/customers', auth, async (req, res) => {
  try {
    const customers = await Sale.aggregate([
      {
        $match: {
          $or: [
            { customerEmail: { $exists: true, $ne: '' } },
            { customerPhone: { $exists: true, $ne: '' } }
          ]
        }
      },
      {
        $group: {
          _id: {
            email: '$customerEmail',
            phone: '$customerPhone',
            name: '$customerName'
          },
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          email: '$_id.email',
          phone: '$_id.phone',
          totalPurchases: 1,
          totalSpent: 1,
          lastPurchase: 1
        }
      },
      { $sort: { lastPurchase: -1 } }
    ]);

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communication/stats
// @desc    Get communication statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Message.aggregate([
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    const totalMessages = await Message.countDocuments();
    const recentMessages = await Message.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      byChannel: stats,
      totalMessages,
      recentMessages
    });
  } catch (error) {
    console.error('Get communication stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
