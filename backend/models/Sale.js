const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const saleSchema = new mongoose.Schema(
  {
    items: [saleItemSchema],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    customerName: String,
    customerEmail: String,
    customerPhone: String,

    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'other'],
      default: 'cash',
    },

    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },

    // 👤 WHO MADE THE SALE
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🧠 WHO OWNS THE DATA (ADMIN)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);
