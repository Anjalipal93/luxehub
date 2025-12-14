const express = require('express');
const { body, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/activity-log
// @desc    Get activity log for current user or all users (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, user, action, resource, startDate, endDate } = req.query;

    // Build query
    const query = {};

    // If not admin, only show current user's activities
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else if (user) {
      query.user = user;
    }

    if (action) query.action = action;
    if (resource) query.resource = resource;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { timestamp: -1 },
      populate: {
        path: 'user',
        select: 'name email'
      }
    };

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .lean();

    // Get stats
    const stats = await Activity.aggregate([
      {
        $match: req.user.role !== 'admin' ? { user: req.user._id } : {}
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          today: {
            $sum: {
              $cond: [
                { $gte: ['$timestamp', new Date(new Date().setHours(0, 0, 0, 0))] },
                1,
                0
              ]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [
                { $gte: ['$timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          login: { $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] } },
          create: { $sum: { $cond: [{ $eq: ['$action', 'create'] }, 1, 0] } },
          update: { $sum: { $cond: [{ $eq: ['$action', 'update'] }, 1, 0] } },
          view: { $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] } }
        }
      }
    ]);

    const activityStats = stats[0] || {
      total: 0,
      today: 0,
      thisWeek: 0,
      login: 0,
      create: 0,
      update: 0,
      view: 0
    };

    res.json({
      activities,
      stats: activityStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length
      }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/activity-log
// @desc    Log a new activity
// @access  Private
router.post('/', auth, [
  body('action').isIn(['login', 'logout', 'create', 'update', 'delete', 'view', 'send', 'generate', 'export']).withMessage('Invalid action'),
  body('resource').isIn(['user', 'product', 'sale', 'message', 'notification', 'report', 'profile', 'dashboard']).withMessage('Invalid resource'),
  body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, resource, description, details } = req.body;

    const activity = new Activity({
      user: req.user._id,
      userName: req.user.name,
      action,
      resource,
      description,
      details: details || {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await activity.save();

    // Emit real-time notification if needed
    const io = req.app.get('io');
    if (io && req.user.role === 'admin') {
      io.emit('new-activity', {
        activity: {
          user: req.user.name,
          action,
          resource,
          description,
          timestamp: activity.timestamp
        }
      });
    }

    res.status(201).json({ activity });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/activity-log/stats
// @desc    Get activity statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const query = req.user.role !== 'admin' ? { user: req.user._id } : {};

    const stats = await Activity.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          today: {
            $sum: {
              $cond: [
                { $gte: ['$timestamp', new Date(new Date().setHours(0, 0, 0, 0))] },
                1,
                0
              ]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [
                { $gte: ['$timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          byAction: {
            $push: '$action'
          },
          byResource: {
            $push: '$resource'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        total: 0,
        today: 0,
        thisWeek: 0,
        byAction: {},
        byResource: {}
      });
    }

    const result = stats[0];
    const byAction = result.byAction.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    const byResource = result.byResource.reduce((acc, resource) => {
      acc[resource] = (acc[resource] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: result.total,
      today: result.today,
      thisWeek: result.thisWeek,
      byAction,
      byResource
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/activity-log/:id
// @desc    Delete an activity (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
