const express = require('express');
const { body, validationResult } = require('express-validator');
const CustomerMessage = require('../models/CustomerMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate thread ID from customer info
const generateThreadId = (customer) => {
  const identifier = customer.email || customer.phone || customer.name;
  return `thread_${Buffer.from(identifier).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;
};

// @route   GET /api/customer-messages
// @desc    Get all customer message threads
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { customerEmail, customerPhone, threadId, unreadOnly } = req.query;
    const query = {};

    if (threadId) {
      query.threadId = threadId;
    } else if (customerEmail) {
      query['customer.email'] = customerEmail;
    } else if (customerPhone) {
      query['customer.phone'] = customerPhone;
    }

    if (unreadOnly === 'true') {
      query.status = { $ne: 'read' };
      query.direction = 'inbound';
    }

    const messages = await CustomerMessage.find(query)
      .populate('sender.userId', 'name email')
      .populate('recipient.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get customer messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customer-messages/threads
// @desc    Get all message threads (conversations)
// @access  Private
router.get('/threads', auth, async (req, res) => {
  try {
    const threads = await CustomerMessage.aggregate([
      {
        $group: {
          _id: '$threadId',
          customer: { $first: '$customer' },
          lastMessage: { $max: '$createdAt' },
          lastMessageContent: { $last: '$content' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$direction', 'inbound'] }, { $ne: ['$status', 'read'] }] },
                1,
                0
              ]
            }
          },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastMessage: -1 } }
    ]);

    res.json(threads);
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customer-messages/thread/:threadId
// @desc    Get all messages in a thread
// @access  Private
router.get('/thread/:threadId', auth, async (req, res) => {
  try {
    const messages = await CustomerMessage.find({ threadId: req.params.threadId })
      .populate('sender.userId', 'name email')
      .populate('recipient.userId', 'name email')
      .sort({ createdAt: 1 });

    // Mark inbound messages as read
    await CustomerMessage.updateMany(
      {
        threadId: req.params.threadId,
        direction: 'inbound',
        status: { $ne: 'read' }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customer-messages/send
// @desc    Send message to customer
// @access  Private
router.post('/send', auth, [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('content').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, subject, content, threadId: providedThreadId } = req.body;

    // Generate or use provided thread ID
    const threadId = providedThreadId || generateThreadId(customer);

    const message = new CustomerMessage({
      customer: {
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || ''
      },
      threadId,
      direction: 'outbound',
      sender: {
        type: 'staff',
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      recipient: {
        type: 'customer',
        name: customer.name,
        email: customer.email || ''
      },
      subject: subject || '',
      content,
      status: 'sent'
    });

    await message.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-customer-message', {
        threadId,
        customer: customer.name,
        message: content,
        from: req.user.name,
        timestamp: new Date()
      });
    }

    const populatedMessage = await CustomerMessage.findById(message._id)
      .populate('sender.userId', 'name email');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send customer message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customer-messages/receive
// @desc    Receive message from customer (webhook or manual)
// @access  Private (or public for webhooks)
router.post('/receive', [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('content').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    console.log('🔵 RECEIVE MESSAGE REQUEST:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, subject, content, threadId: providedThreadId } = req.body;

    // Generate or use provided thread ID
    const threadId = providedThreadId || generateThreadId(customer);

    const message = new CustomerMessage({
      customer: {
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || ''
      },
      threadId,
      direction: 'inbound',
      sender: {
        type: 'customer',
        name: customer.name,
        email: customer.email || ''
      },
      recipient: {
        type: 'staff',
        name: 'Support Team'
      },
      subject: subject || '',
      content,
      status: 'sent'
    });

    await message.save();
    console.log('✅ Message saved successfully:', message._id);

    // Find all staff/admin users to notify
    console.log('👥 Finding staff users...');
    const staffUsers = await User.find({
      role: { $in: ['admin', 'employee'] },
      isActive: true
    }).select('_id name email role');

    console.log(`Found ${staffUsers.length} staff users:`, staffUsers.map(u => `${u.name} (${u.role})`));

    // Create notifications for all staff members
    const notifications = staffUsers.map(user => ({
      user: user._id,
      type: 'new_message',
      title: 'New Customer Message',
      message: `New message from ${customer.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      link: `/messages/thread/${threadId}`,
      metadata: {
        threadId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        messageId: message._id
      }
    }));

    console.log(`📝 Created ${notifications.length} notification objects`);

    // Save all notifications
    if (notifications.length > 0) {
      try {
        const savedNotifications = await Notification.insertMany(notifications);
        console.log(`✅ Successfully saved ${savedNotifications.length} notifications`);
      } catch (notificationError) {
        console.error('❌ Error saving notifications:', notificationError);
      }
    } else {
      console.log('⚠️ No staff users found to notify');
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-customer-message', {
        threadId,
        customer: customer.name,
        message: content,
        from: customer.name,
        timestamp: new Date(),
        isInbound: true
      });

      // Emit notification count update for real-time UI updates
      staffUsers.forEach(user => {
        io.emit(`notification-update-${user._id}`, {
          type: 'new_message',
          count: 1,
          message: `New message from ${customer.name}`
        });
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Receive customer message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customer-messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await CustomerMessage.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customer-messages/stats
// @desc    Get messaging statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await CustomerMessage.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          inboundMessages: {
            $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] }
          },
          outboundMessages: {
            $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] }
          },
          unreadMessages: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$direction', 'inbound'] }, { $ne: ['$status', 'read'] }] },
                1,
                0
              ]
            }
          },
          totalThreads: { $addToSet: '$threadId' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          inboundMessages: 1,
          outboundMessages: 1,
          unreadMessages: 1,
          totalThreads: { $size: '$totalThreads' }
        }
      }
    ]);

    res.json(stats[0] || {
      totalMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0,
      unreadMessages: 0,
      totalThreads: 0
    });
  } catch (error) {
    console.error('Get messaging stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

