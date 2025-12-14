const mongoose = require('mongoose');

const collaboratorInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Expired'],
    default: 'Pending',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitedDate: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  token: {
    type: String,
    unique: true,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
collaboratorInviteSchema.index({ email: 1, status: 1 });
collaboratorInviteSchema.index({ token: 1 });
collaboratorInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('CollaboratorInvite', collaboratorInviteSchema);