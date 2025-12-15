const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { logSaleActivity } = require('../services/activityLogger');

const router = express.Router();

// @route   GET /api/sales
// @desc    Get all sales (filtered by user for non-admins)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = {};

    // Filter sales by user ID for non-admin users
    if (req.user.role !== 'admin') {
      query.soldBy = req.user._id;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    const sales = await Sale.find(query)
      .populate('items.product', 'name category brand price')
      .populate('soldBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name category brand price')
      .populate('soldBy', 'name email');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body;

    // Validate products and check stock
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      // Check if product belongs to current user (admins can sell any product)
      if (req.user.role !== 'admin' && product.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: `Access denied. You can only sell your own products.`
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }

      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        subtotal
      });
    }

    // Create sale
    const sale = new Sale({
      items: saleItems,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod: paymentMethod || 'cash',
      soldBy: req.user._id,
      ownerId: req.user._id,
      // Additional fields for Team Sales module
      userId: req.user._id,
      userName: req.user.name,
      amount: totalAmount,
      date: new Date(),
      notes
    });

    await sale.save();

    // Log activity
    await logSaleActivity(req, 'create', `Created sale worth ₹${totalAmount}`, {
      saleId: sale._id,
      customerName,
      totalAmount,
      itemCount: saleItems.length
    });

    // Update inventory
    for (const item of saleItems) {
      const product = await Product.findById(item.product);
      product.quantity -= item.quantity;

      // Check for low stock
      if (product.checkLowStock() && !product.lowStockAlert) {
        product.lowStockAlert = true;

        // Create notification
        await Notification.create({
          user: req.user._id,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.quantity} remaining)`,
          link: `/products/${product._id}`
        });
      }

      await product.save();
    }

    // Create sale notification
    await Notification.create({
      user: req.user._id,
      type: 'new_sale',
      title: 'New Sale Recorded',
      message: `Sale of $${totalAmount.toFixed(2)} has been recorded`,
      link: `/sales/${sale._id}`
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-sale', {
        saleId: sale._id,
        totalAmount,
        timestamp: new Date()
      });
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name category brand price')
      .populate('soldBy', 'name email');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/stats/revenue
// @desc    Get revenue statistics
// @access  Private
router.get('/stats/revenue', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const matchStage = {
      createdAt: { $gte: startDate },
      status: 'completed'
    };

    // Filter by user for non-admin users
    if (req.user.role !== 'admin') {
      matchStage.soldBy = req.user._id;
    }

    const stats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 },
          averageSale: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json(stats[0] || { totalRevenue: 0, totalSales: 0, averageSale: 0 });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/stats/top-products
// @desc    Get top selling products
// @access  Private
router.get('/stats/top-products', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const matchStage = {};

    // Filter by user for non-admin users
    if (req.user.role !== 'admin') {
      matchStage.soldBy = req.user._id;
    }

    const topProducts = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
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
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales/add
// @desc    Add a simple sale (for Team Sales module)
// @access  Private
router.post('/add', auth, [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { customerName, amount } = req.body;

    // Create a simple sale record
    // In production, you might want to create a separate TeamSale model
    // For now, we'll use a simplified Sale record
    const sale = new Sale({
      items: [], // Empty items array for simple sales
      totalAmount: parseFloat(amount),
      customerName: customerName.trim(),
      soldBy: req.user._id,
      ownerId: req.user._id,
      // Additional fields for Team Sales module
      userId: req.user._id,
      userName: req.user.name,
      amount: parseFloat(amount),
      date: new Date(),
      status: 'completed',
      paymentMethod: 'cash'
    });

    await sale.save();

    res.json({
      success: true,
      message: 'Sale added successfully',
      sale: {
        _id: sale._id,
        customerName: sale.customerName,
        amount: sale.totalAmount,
        date: sale.createdAt
      }
    });
  } catch (error) {
    console.error('Add sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding sale'
    });
  }
});

// @route   GET /api/sales/my
// @desc    Get current user's sales
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const sales = await Sale.find({ soldBy: req.user._id })
      .populate('soldBy', 'name email')
      .populate('items.product', 'name category brand price')
      .sort({ createdAt: -1 })
      .limit(100);

    // Format for Team Sales module
    const formattedSales = sales.map(sale => ({
      _id: sale._id,
      customerName: sale.customerName || 'N/A',
      amount: sale.totalAmount,
      date: sale.createdAt,
      createdAt: sale.createdAt,
      items: sale.items || [],
      itemCount: sale.items?.length || 0
    }));

    res.json({
      success: true,
      sales: formattedSales
    });
  } catch (error) {
    console.error('Get my sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sales'
    });
  }
});

// @route   GET /api/sales/team
// @desc    Get team sales grouped by team member (admin only)
// @access  Private (Admin)
router.get('/team', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    // Get all sales and group by user
    const sales = await Sale.find({ status: 'completed' })
      .populate('soldBy', 'name email')
      .sort({ createdAt: -1 });

    // Group sales by user
    const teamSales = {};

    sales.forEach(sale => {
      const userId = sale.soldBy?._id?.toString() || sale.userId?.toString();
      const userName = sale.soldBy?.name || sale.userName || 'Unknown';

      if (!teamSales[userId]) {
        teamSales[userId] = {
          userId: userId,
          userName: userName,
          totalSales: 0,
          sales: []
        };
      }

      const saleAmount = sale.amount || sale.totalAmount || 0;
      teamSales[userId].totalSales += saleAmount;

      teamSales[userId].sales.push({
        _id: sale._id,
        amount: saleAmount,
        customerName: sale.customerName || 'N/A',
        date: sale.date || sale.createdAt
      });
    });

    // Convert to array and sort by total sales descending
    const result = Object.values(teamSales).sort((a, b) => b.totalSales - a.totalSales);

    res.json({
      success: true,
      teamSales: result
    });
  } catch (error) {
    console.error('Get team sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team sales'
    });
  }
});

module.exports = router;

