const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['member', 'manager'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  salesCount: {
    type: Number,
    default: 0
  },
  productsCount: {
    type: Number,
    default: 0
  }
});

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  ownerEmail: {
    type: String,
    required: true
  },
  members: [teamMemberSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
teamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to add a team member
teamSchema.methods.addMember = function(memberData) {
  // Check if member already exists
  const existingMember = this.members.find(m => m.email === memberData.email.toLowerCase());
  if (existingMember) {
    throw new Error('Member with this email already exists in the team');
  }

  this.members.push({
    userId: memberData.userId,
    name: memberData.name,
    email: memberData.email,
    role: memberData.role || 'member',
    status: 'active',
    joinedAt: new Date()
  });

  return this.save();
};

// Method to remove a team member
teamSchema.methods.removeMember = function(memberId) {
  this.members = this.members.filter(m => m._id.toString() !== memberId.toString());
  return this.save();
};

// Method to update member stats
teamSchema.methods.updateMemberStats = function(memberId, stats) {
  const member = this.members.id(memberId);
  if (member) {
    if (stats.salesCount !== undefined) member.salesCount = stats.salesCount;
    if (stats.productsCount !== undefined) member.productsCount = stats.productsCount;
    return this.save();
  }
  throw new Error('Member not found');
};

// Static method to get team by owner
teamSchema.statics.getTeamByOwner = function(ownerId) {
  return this.findOne({ ownerId });
};

// Static method to get user's teams (as member)
teamSchema.statics.getUserTeams = function(userId) {
  return this.find({ 'members.userId': userId });
};

module.exports = mongoose.model('Team', teamSchema);
