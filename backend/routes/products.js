const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, brand, lowStock } = req.query;
    const query = {};

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
    const product = await Product.findById(req.params.id);
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

    const productData = { ...req.body };
    
    // Add image path if file was uploaded
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = new Product(productData);
    await product.save();

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
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Add image path if new file was uploaded
    if (req.file) {
      // Delete old image if exists
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image) {
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
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
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
    const stats = await Product.aggregate([
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

module.exports = router;

