const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const aiForecastService = require('../services/aiForecast');

const router = express.Router();

// @route   GET /api/ai/forecast/sales
// @desc    Get sales forecast for all products
// @access  Private
router.get('/forecast/sales', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const forecasts = [];

    // Get last 6 months of sales data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (const product of products) {
      // Get historical sales for this product
      const sales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: 'completed'
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.product': product._id
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
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
        inventoryForecast
      });
    }

    res.json(forecasts);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/forecast/product/:id
// @desc    Get forecast for a specific product
// @access  Private
router.get('/forecast/product/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get historical sales
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.product': product._id
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
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

    res.json({
      product: {
        id: product._id,
        name: product.name,
        category: product.category
      },
      historicalSales,
      salesForecast,
      inventoryForecast
    });
  } catch (error) {
    console.error('Product forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/suggestions
// @desc    Get AI-powered suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    // Get top selling products
    const topProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Get forecasts
    const forecasts = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (const product of products.slice(0, 20)) { // Limit for performance
      const sales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: 'completed'
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.product': product._id
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$items.quantity' }
          }
        }
      ]);

      const historicalSales = sales.length > 0 ? [sales[0].totalQuantity] : [0];
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
        productId: product._id.toString(),
        ...inventoryForecast
      });
    }

    const suggestions = aiForecastService.generateSuggestions(products, topProducts, forecasts);

    res.json({
      suggestions,
      topProducts: topProducts.slice(0, 5),
      totalSuggestions: suggestions.length
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/forecast/sales/monthly
// @desc    Get monthly sales totals and simple forecast for next 3 months
// @access  Private
router.get('/forecast/sales/monthly', auth, async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Aggregate monthly revenue and count for last 12 months
    const monthly = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill missing months with zeros
    const monthlySeries = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = monthly.find((x) => x._id.year === y && x._id.month === m);
      monthlySeries.push({
        label: `${y}-${String(m).padStart(2, '0')}`,
        year: y,
        month: m,
        revenue: key ? key.revenue : 0,
        count: key ? key.count : 0,
      });
    }

    // Simple forecast: use last 3 months average with a mild trend
    const last3 = monthlySeries.slice(-3);
    const avgRevenue =
      last3.reduce((sum, x) => sum + x.revenue, 0) / (last3.length || 1);
    const avgCount =
      last3.reduce((sum, x) => sum + x.count, 0) / (last3.length || 1);

    const forecasts = [];
    for (let i = 1; i <= 3; i++) {
      const future = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecasts.push({
        label: `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}`,
        year: future.getFullYear(),
        month: future.getMonth() + 1,
        revenue: Math.max(0, Math.round(avgRevenue * 1.05)), // +5% growth
        count: Math.max(0, Math.round(avgCount * 1.03)), // +3% growth
        isForecast: true,
      });
    }

    res.json({
      history: monthlySeries,
      forecast: forecasts,
    });
  } catch (error) {
    console.error('Monthly forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/insights
// @desc    Get AI-powered insights and analytics
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    // Get sales data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    }).populate('soldBy', 'name email');

    // Get messages data
    const Message = require('../models/Message');
    const messages = await Message.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalMessages = messages.length;
    
    // Channel performance
    const channelCounts = {};
    messages.forEach(msg => {
      channelCounts[msg.channel] = (channelCounts[msg.channel] || 0) + 1;
    });
    
    const topChannel = Object.keys(channelCounts).reduce((a, b) => 
      channelCounts[a] > channelCounts[b] ? a : b, 'email'
    );

    // Sales chart data (last 7 days)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = sales.filter(s => 
        s.createdAt >= date && s.createdAt < nextDate
      );
      const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      
      salesChart.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        predicted: revenue * 1.1, // Simple prediction
      });
    }

    // Channel performance data
    const channelPerformance = Object.entries(channelCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value,
    }));

    // Activity trends
    const activityTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayMessages = messages.filter(m => 
        m.createdAt >= date && m.createdAt < nextDate
      );
      
      activityTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activity: dayMessages.length,
      });
    }

    // Communication stats
    const communicationStats = Object.entries(channelCounts).map(([channel, sent]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      sent: sent,
      success: Math.round(sent * 0.85), // 85% success rate estimate
    }));

    // AI predictions
    const avgDailySales = salesChart.reduce((sum, d) => sum + d.revenue, 0) / 7;
    const predictedRevenue = Math.round(avgDailySales * 30 * 1.1); // +10% growth

    // Find best performer
    const salesByUser = {};
    sales.forEach(sale => {
      const userId = sale.soldBy?._id?.toString() || 'unknown';
      salesByUser[userId] = (salesByUser[userId] || 0) + sale.totalAmount;
    });
    const bestPerformerId = Object.keys(salesByUser).reduce((a, b) => 
      salesByUser[a] > salesByUser[b] ? a : b, null
    );
    const bestPerformerSale = sales.find(s => 
      s.soldBy?._id?.toString() === bestPerformerId
    );
    const bestPerformer = bestPerformerSale?.soldBy?.name || 'Team Member';

    // Generate recommendations
    const recommendations = [
      'Reach out to inactive customers.',
      'Follow up more frequently using email.',
      'Your response time is slow. Improve by 20%.',
      'Focus on WhatsApp for higher conversion rates.',
    ];

    if (channelCounts.whatsapp && channelCounts.whatsapp < totalMessages * 0.5) {
      recommendations.push('Increase WhatsApp usage for better engagement.');
    }

    res.json({
      summary: {
        totalMessages,
        totalSales,
        topChannel,
        productivityScore: Math.min(100, Math.round((totalSales / 50000) * 100)),
      },
      predictions: {
        estimatedRevenue: `₹${predictedRevenue.toLocaleString()}`,
        bestPerformer,
        recommendedAction: 'Increase outreach on WhatsApp',
      },
      customerBehavior: {
        fastResponders: 'Customers typically respond within 2-4 hours',
        preferredChannel: `${topChannel.charAt(0).toUpperCase() + topChannel.slice(1)} (${Math.round((channelCounts[topChannel] / totalMessages) * 100)}% of customers prefer this channel)`,
        bestTime: '10 AM - 2 PM (Highest response rate)',
      },
      recommendations,
      salesChart,
      channelPerformance: channelPerformance.length > 0 ? channelPerformance : [
        { name: 'Email', value: 40 },
        { name: 'Whatsapp', value: 60 },
      ],
      activityTrends,
      communicationStats: communicationStats.length > 0 ? communicationStats : [
        { channel: 'Email', sent: 50, success: 45 },
        { channel: 'Whatsapp', sent: 70, success: 60 },
      ],
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ai/generate-outreach
// @desc    Generate AI-powered outreach message
// @access  Private
router.post('/generate-outreach', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, industry } = req.body;
    
    // Simple AI message generation (can be replaced with OpenAI API)
    const templates = [
      `Hello ${name}, I admire your work in ${industry || 'your industry'}. I would love to collaborate or learn from your experience.`,
      `Hi ${name}, Your achievements in ${industry || 'your field'} are inspiring. Would you be open to a brief conversation about your journey?`,
      `Dear ${name}, I'm reaching out because I'm interested in learning more about your work in ${industry || 'your industry'}. Could we connect for a quick chat?`,
    ];
    
    const message = templates[Math.floor(Math.random() * templates.length)];
    
    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Generate outreach error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

