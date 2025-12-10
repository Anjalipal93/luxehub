const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Total sales
    const totalSales = await Sale.countDocuments();
    const monthlySales = await Sale.countDocuments({ createdAt: { $gte: startOfMonth } });
    const dailySales = await Sale.countDocuments({ createdAt: { $gte: startOfDay } });

    // Revenue
    const revenueStats = await Sale.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          monthlyRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfMonth] },
                '$totalAmount',
                0
              ]
            }
          },
          dailyRevenue: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfDay] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      monthlyRevenue: 0,
      dailyRevenue: 0
    };

    // Products
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ lowStockAlert: true });
    const activeProducts = await Product.countDocuments({ isActive: true });

    // Users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Messages
    const totalMessages = await Message.countDocuments();
    const recentMessages = await Message.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Unread notifications
    const unreadNotifications = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      sales: {
        total: totalSales,
        monthly: monthlySales,
        daily: dailySales
      },
      revenue: {
        total: revenue.totalRevenue,
        monthly: revenue.monthlyRevenue,
        daily: revenue.dailyRevenue
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      communication: {
        totalMessages,
        recentMessages
      },
      notifications: {
        unread: unreadNotifications
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/charts/sales
// @desc    Get sales chart data
// @access  Private
router.get('/charts/sales', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, groupFormat;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        groupFormat = { hour: { $hour: '$createdAt' } };
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        groupFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        groupFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        groupFormat = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        groupFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' } };
    }

    const chartData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json(chartData);
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/charts/products
// @desc    Get product category chart data
// @access  Private
router.get('/charts/products', auth, async (req, res) => {
  try {
    const categoryData = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(categoryData);
  } catch (error) {
    console.error('Get product chart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

