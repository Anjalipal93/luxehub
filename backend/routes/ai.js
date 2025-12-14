const express = require('express');
const { body } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const aiForecastService = require('../services/aiForecast');

const router = express.Router();

/* ======================================================
   SALES FORECAST – ALL PRODUCTS (OWNER SCOPED)
====================================================== */
router.get('/forecast/sales', auth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId || req.user._id;

    const products = await Product.find({
      isActive: true,
      $or: [
        { ownerId },
        { userId: ownerId } // backward compatibility
      ]
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const forecasts = [];

    for (const product of products) {
      const sales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: 'completed',
            ownerId,
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.product': product._id } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalQuantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const historicalSales = sales.map(s => s.totalQuantity);

      const salesForecast = await aiForecastService.forecastProductSales(
        product._id,
        historicalSales
      );

      const inventoryForecast = await aiForecastService.forecastInventory(
        product,
        salesForecast.forecast,
        product.quantity
      );

      forecasts.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        currentStock: product.quantity,
        salesForecast,
        inventoryForecast,
      });
    }

    res.json(forecasts);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ======================================================
   AI INSIGHTS (OWNER SCOPED – FULLY FIXED)
====================================================== */
router.get('/insights', auth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId || req.user._id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* -------- SALES -------- */
    const sales = await Sale.find({
      ownerId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const totalSales = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );

    /* -------- MESSAGES -------- */
    const Message = require('../models/Message');
    const CustomerMessage = require('../models/CustomerMessage');

    const messages = await Message.find({
      sentBy: ownerId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const customerMessages = await CustomerMessage.find({
      userId: ownerId,
      direction: 'outbound',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const totalMessages = messages.length + customerMessages.length;

    /* -------- CHANNEL COUNTS -------- */
    const channelCounts = {
      whatsapp: 0,
      email: 0,
      web: 0,
    };

    messages.forEach(m => {
      const ch = m.channel || m.metadata?.channel || 'web';
      if (channelCounts[ch] !== undefined) channelCounts[ch]++;
    });

    customerMessages.forEach(m => {
      const ch = m.metadata?.channel || 'email';
      if (channelCounts[ch] !== undefined) channelCounts[ch]++;
    });

    const channelPerformance = Object.entries(channelCounts).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })
    );

    const topChannel =
      Math.max(...Object.values(channelCounts)) > 0
        ? channelPerformance.reduce((a, b) => (b.value > a.value ? b : a)).name
        : 'None';

    /* -------- SALES CHART (7 DAYS) -------- */
    const salesChart = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const revenue = sales
        .filter(s => s.createdAt >= day && s.createdAt < nextDay)
        .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);

      salesChart.push({
        date: day.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        revenue,
        predicted: Math.round(revenue * 1.1),
      });
    }

    /* -------- ACTIVITY TRENDS -------- */
    const activityTrends = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      activityTrends.push({
        date: start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        activity:
          messages.filter(m => m.createdAt >= start && m.createdAt < end).length +
          customerMessages.filter(m => m.createdAt >= start && m.createdAt < end).length,
      });
    }

    /* -------- COMMUNICATION STATS -------- */
    const communicationStats = Object.entries(channelCounts).map(
      ([channel, sent]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        sent,
        success: totalMessages
          ? Math.round((sent / totalMessages) * 100)
          : 0,
      })
    );

    /* -------- RECOMMENDATIONS -------- */
    const recommendations = [];

    if (totalMessages === 0)
      recommendations.push('Start messaging customers to increase engagement.');

    if (totalSales === 0)
      recommendations.push('No sales recorded. Focus on follow-ups.');

    if (topChannel !== 'None')
      recommendations.push(`Focus more on ${topChannel} for better results.`);

    if (!recommendations.length)
      recommendations.push('Your performance is stable. Keep it up.');

    /* -------- RESPONSE -------- */
    res.json({
      summary: {
        totalMessages,
        totalSales,
        topChannel,
        productivityScore: Math.min(
          100,
          Math.round((totalSales / 50000) * 100)
        ),
      },
      predictions: {
        estimatedRevenue: `₹${Math.round(totalSales * 1.1).toLocaleString()}`,
        bestPerformer: req.user.name || 'You',
        recommendedAction:
          topChannel !== 'None'
            ? `Increase outreach on ${topChannel}`
            : 'Increase customer engagement',
      },
      salesChart,
      channelPerformance,
      activityTrends,
      communicationStats,
      recommendations,
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ======================================================
   AI OUTREACH MESSAGE
====================================================== */
router.post(
  '/generate-outreach',
  auth,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  async (req, res) => {
    const { name, industry } = req.body;

    const templates = [
      `Hello ${name}, I admire your work in ${industry || 'your industry'}.`,
      `Hi ${name}, your journey in ${industry || 'your field'} is inspiring.`,
      `Dear ${name}, I’d love to connect and learn more about your work.`,
    ];

    res.json({
      success: true,
      message: templates[Math.floor(Math.random() * templates.length)],
    });
  }
);

module.exports = router;
