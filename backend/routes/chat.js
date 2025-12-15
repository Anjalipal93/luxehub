const express = require('express');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/messages/:userId
// @desc    Get chat history between current user and another user
// @access  Private
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert to ObjectId for query
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);

    // Find all messages between the two users (bidirectional)
    const messages = await ChatMessage.find({
      $or: [
        { fromUserId: currentUserObjectId, toUserId: otherUserObjectId },
        { fromUserId: otherUserObjectId, toUserId: currentUserObjectId }
      ]
    })
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(200);

    // Mark messages as delivered and read if they're to the current user
    await ChatMessage.updateMany(
      {
        fromUserId: otherUserObjectId,
        toUserId: currentUserObjectId,
        delivered: false
      },
      {
        $set: {
          delivered: true,
          read: true
        }
      }
    );

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      fromUserId: msg.fromUserId._id ? msg.fromUserId._id.toString() : msg.fromUserId.toString(),
      fromUsername: msg.fromUserId.name || msg.fromUserId.username || 'Unknown',
      toUserId: msg.toUserId._id ? msg.toUserId._id.toString() : msg.toUserId.toString(),
      timestamp: msg.createdAt,
      ts: msg.createdAt,
      isMe: msg.fromUserId._id ? msg.fromUserId._id.toString() === currentUserId : msg.fromUserId.toString() === currentUserId,
      delivered: msg.delivered,
      read: msg.read,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get list of all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // Get all unique user IDs that the current user has messaged or been messaged by
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: currentUserObjectId },
            { toUserId: currentUserObjectId }
          ]
        }
      },
      {
        $project: {
          otherUserId: {
            $cond: [
              { $eq: ['$fromUserId', currentUserObjectId] },
              '$toUserId',
              '$fromUserId'
            ]
          },
          lastMessage: {
            text: '$text',
            timestamp: '$createdAt',
            fromUserId: '$fromUserId',
            toUserId: '$toUserId',
            read: '$read'
          }
        }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $last: '$lastMessage' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$lastMessage.fromUserId', currentUserObjectId] },
                    { $eq: ['$lastMessage.read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

