const mongoose = require('mongoose');

const customerMessageSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  threadId: {
    type: String,
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  sender: {
    type: {
      type: String,
      enum: ['customer', 'staff', 'system'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String
    }
  },
  recipient: {
    type: {
      type: String,
      enum: ['customer', 'staff'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String
    }
  },
  subject: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  readAt: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
customerMessageSchema.index({ threadId: 1, createdAt: -1 });
customerMessageSchema.index({ 'customer.email': 1 });
customerMessageSchema.index({ 'customer.phone': 1 });
customerMessageSchema.index({ 'sender.userId': 1 });
customerMessageSchema.index({ status: 1 });

module.exports = mongoose.model('CustomerMessage', customerMessageSchema);

