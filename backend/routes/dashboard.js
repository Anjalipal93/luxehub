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
    const userId = req.user._id;
    const ownerId = req.user.ownerId || req.user._id;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Build sales query based on user role
    // For employees: show only their sales. For owners/admins: show all team sales
    const salesQuery = req.user.role === 'employee' 
      ? { soldBy: userId, status: 'completed' }
      : { ownerId, status: 'completed' };
    
    const salesQueryMonthly = { ...salesQuery, createdAt: { $gte: startOfMonth } };
    const salesQueryDaily = { ...salesQuery, createdAt: { $gte: startOfDay } };

    // Total sales
    const totalSales = await Sale.countDocuments(salesQuery);
    const monthlySales = await Sale.countDocuments(salesQueryMonthly);
    const dailySales = await Sale.countDocuments(salesQueryDaily);

    // Revenue
    const revenueStats = await Sale.aggregate([
      {
        $match: salesQuery
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

    // Products - filter by user
    const productsQuery = req.user.role === 'employee' 
      ? { userId }
      : { userId: ownerId };
    
    const totalProducts = await Product.countDocuments(productsQuery);
    const lowStockProducts = await Product.countDocuments({ ...productsQuery, lowStockAlert: true });
    const activeProducts = await Product.countDocuments({ ...productsQuery, isActive: true });

    // Users - only show team members for owners, or just self for employees
    let usersQuery = {};
    if (req.user.role === 'employee') {
      usersQuery = { _id: userId };
    } else {
      usersQuery = { 
        $or: [
          { ownerId },
          { _id: ownerId }
        ]
      };
    }
    
    const totalUsers = await User.countDocuments(usersQuery);
    const activeUsers = await User.countDocuments({ ...usersQuery, isActive: true });

    // Messages - filter by user
    const messagesQuery = req.user.role === 'employee'
      ? { sentBy: userId }
      : { ownerId };
    
    const totalMessages = await Message.countDocuments(messagesQuery);
    const recentMessages = await Message.countDocuments({
      ...messagesQuery,
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
    const userId = req.user._id;
    const ownerId = req.user.ownerId || req.user._id;
    
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

    // Build match query based on user role
    const matchQuery = req.user.role === 'employee'
      ? {
          soldBy: userId,
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      : {
          ownerId,
          createdAt: { $gte: startDate },
          status: 'completed'
        };

    const chartData = await Sale.aggregate([
      {
        $match: matchQuery
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
    const userId = req.user._id;
    const ownerId = req.user.ownerId || req.user._id;
    
    // Build match query based on user role
    const matchQuery = req.user.role === 'employee'
      ? { userId }
      : { userId: ownerId };
    
    const categoryData = await Product.aggregate([
      {
        $match: matchQuery
      },
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

