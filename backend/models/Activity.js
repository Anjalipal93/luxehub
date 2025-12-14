const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'send', 'generate', 'export']
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'product', 'sale', 'message', 'notification', 'report', 'profile', 'dashboard']
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ action: 1, timestamp: -1 });
activitySchema.index({ resource: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
