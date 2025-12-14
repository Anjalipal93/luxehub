const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  unit: {
    type: String,
    default: 'piece'
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockAlert: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Check if stock is low
productSchema.methods.checkLowStock = function() {
  return this.quantity <= this.minThreshold;
};

module.exports = mongoose.model('Product', productSchema);

