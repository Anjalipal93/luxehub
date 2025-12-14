const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');
const { logProductActivity } = require('../services/activityLogger');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (filtered by user for non-admins)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.json([]); // Return empty array if DB not available
    }

    const { category, brand, lowStock } = req.query;
    const query = {};

    // Filter products by user ID for non-admin users
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
      console.log(`Filtering products for user: ${req.user._id}, role: ${req.user.role}`);
    } else {
      console.log(`Admin user ${req.user._id} accessing all products`);
    }

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (lowStock === 'true') query.lowStockAlert = true;

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Filter by user ID for non-admin users
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (All authenticated users)
router.post('/', auth, upload.single('image'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('minThreshold').isInt({ min: 0 }).withMessage('Minimum threshold must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not available. Please ensure MongoDB is running and try again.',
        error: 'Database connection required for product creation'
      });
    }

    const productData = { ...req.body, userId: req.user._id };

    // Add image path if file was uploaded
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = new Product(productData);
    await product.save();

    // Log activity
    await logProductActivity(req, 'create', `Added new product: ${product.name}`, {
      productId: product._id,
      category: product.category,
      price: product.price,
      quantity: product.quantity
    });

    // Check for low stock
    if (product.checkLowStock()) {
      product.lowStockAlert = true;
      await product.save();

      // Create notification for admin
      await Notification.create({
        user: req.user._id,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.quantity} remaining)`,
        link: `/products/${product._id}`
      });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);

    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation Error', errors });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate product name' });
    }

    res.status(500).json({ message: 'Failed to save product', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (users can update their own, admins can update any)
// @access  Private
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Find the product first to check permissions
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user can update this product
    if (req.user.role !== 'admin' && existingProduct.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own products.' });
    }

    // Add image path if new file was uploaded
    if (req.file) {
      // Delete old image if exists
      if (existingProduct.image) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '..', oldProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for low stock
    if (product.checkLowStock() && !product.lowStockAlert) {
      product.lowStockAlert = true;
      await product.save();

      await Notification.create({
        user: req.user._id,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.quantity} remaining)`,
        link: `/products/${product._id}`
      });
    } else if (!product.checkLowStock() && product.lowStockAlert) {
      product.lowStockAlert = false;
      await product.save();
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (users can delete their own, admins can delete any)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find the product first to check permissions
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user can delete this product
    if (req.user.role !== 'admin' && product.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own products.' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Log activity
    await logProductActivity(req, 'delete', `Deleted product: ${product.name}`, {
      productId: product._id,
      category: product.category
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/stats/categories
// @desc    Get product statistics by category
// @access  Private
router.get('/stats/categories', auth, async (req, res) => {
  try {
    const matchStage = {};

    // Filter products by user ID for non-admin users
    if (req.user.role !== 'admin') {
      matchStage.userId = req.user._id;
    }

    const stats = await Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/migrate
// @desc    Migrate existing products to have userId (admin only)
// @access  Private (Admin)
router.post('/migrate', auth, adminOnly, async (req, res) => {
  try {
    // Find products without userId
    const productsWithoutUserId = await Product.find({ userId: { $exists: false } });

    if (productsWithoutUserId.length === 0) {
      return res.json({ message: 'No products need migration' });
    }

    // Get the first admin user to assign products to
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return res.status(400).json({ message: 'No admin user found for migration' });
    }

    // Update all products without userId to use the admin user
    const result = await Product.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: adminUser._id } }
    );

    console.log(`Migrated ${result.modifiedCount} products to user ${adminUser._id}`);
    res.json({
      message: `Migrated ${result.modifiedCount} products to admin user`,
      migratedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

module.exports = router;

