const express = require('express');
const Sale = require('../models/Sale');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/team-performance
// @desc    Get team performance data and leaderboard
// @access  Private
router.get('/team-performance', auth, async (req, res) => {
  try {
    // Get all users (team members)
    const users = await User.find({ isActive: true });
    
    // Get sales data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sales = await Sale.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    }).populate('soldBy', 'name email');

    // Get messages data
    const messages = await Message.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('sentBy', 'name email');

    // Calculate performance for each user
    const performanceData = users.map(user => {
      const userSales = sales.filter(s => s.soldBy?._id?.toString() === user._id.toString());
      const userMessages = messages.filter(m => m.sentBy?._id?.toString() === user._id.toString());
      
      const totalSales = userSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const messagesSent = userMessages.length;
      const conversionRate = messagesSent > 0 
        ? Math.round((userSales.length / messagesSent) * 100)
        : 0;
      
      // Calculate rating (0-5 stars)
      const rating = Math.min(5, Math.max(0, 
        (totalSales / 20000) * 2.5 + (conversionRate / 30) * 2.5
      ));

      return {
        _id: user._id,
        id: user._id,
        name: user.name,
        sales: totalSales,
        totalSales: totalSales,
        messagesSent: messagesSent,
        totalMessages: messagesSent,
        conversionRate: conversionRate,
        rating: Math.round(rating * 10) / 10,
      };
    });

    // Sort by sales for leaderboard
    const leaderboard = [...performanceData].sort((a, b) => b.sales - a.sales);

    // Calculate team metrics
    const totalTeamSales = performanceData.reduce((sum, p) => sum + p.sales, 0);
    const avgConversionRate = performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, p) => sum + p.conversionRate, 0) / performanceData.length)
      : 0;

    // Calculate performance score (0-100)
    const maxSales = Math.max(...performanceData.map(p => p.sales), 1);
    const salesScore = Math.min(50, (totalTeamSales / 200000) * 50);
    const conversionScore = Math.min(30, (avgConversionRate / 50) * 30);
    const activityScore = Math.min(20, (performanceData.reduce((sum, p) => sum + p.messagesSent, 0) / 500) * 20);
    const performanceScore = Math.round(salesScore + conversionScore + activityScore);

    // Weekly trends (last 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekSales = sales.filter(s => 
        s.createdAt >= weekStart && s.createdAt < weekEnd
      );
      const weekMessages = messages.filter(m => 
        m.createdAt >= weekStart && m.createdAt < weekEnd
      );

      weeklyTrends.push({
        week: `Week ${4 - i}`,
        sales: weekSales.reduce((sum, s) => sum + s.totalAmount, 0),
        messages: weekMessages.length,
      });
    }

    // Generate improvement suggestions
    const suggestions = [];
    
    if (avgConversionRate < 20) {
      suggestions.push('Follow up within 24 hours to improve conversions.');
    }
    
    const whatsappMessages = messages.filter(m => m.channel === 'whatsapp').length;
    const emailMessages = messages.filter(m => m.channel === 'email').length;
    
    if (whatsappMessages > 0 && (whatsappMessages / messages.length) < 0.5) {
      suggestions.push('Use WhatsApp more — your response rate is higher there.');
    }
    
    if (performanceData.some(p => p.messagesSent < 10)) {
      suggestions.push('Improve outreach quantity on Mondays.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Maintain consistent outreach frequency.');
      suggestions.push('Focus on high-value prospects for better ROI.');
      suggestions.push('Track and analyze response patterns to optimize timing.');
    }

    res.json({
      leaderboard: leaderboard.slice(0, 10), // Top 10
      individualPerformance: performanceData,
      performanceScore,
      totalSales: totalTeamSales,
      avgConversionRate,
      weeklyTrends,
      suggestions,
    });
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

