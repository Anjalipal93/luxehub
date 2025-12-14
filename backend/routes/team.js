const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post('/', auth, [
  body('teamName').trim().notEmpty().withMessage('Team name is required'),
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

    const { teamName } = req.body;

    // Check if user already has a team
    const existingTeam = await Team.findOne({ ownerId: req.user._id });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already have a team. You can only own one team.'
      });
    }

    // Create new team with owner as first member
    const team = new Team({
      teamName,
      ownerId: req.user._id,
      ownerName: req.user.name,
      ownerEmail: req.user.email,
      members: [{
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: 'manager',
        status: 'active',
        joinedAt: new Date()
      }]
    });

    await team.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team'
    });
  }
});

// @route   GET /api/teams/my
// @desc    Get current user's team (as owner or member)
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    // First check if user owns a team
    let team = await Team.findOne({ ownerId: req.user._id });

    // If not owner, check if user is a member of any team
    if (!team) {
      team = await Team.findOne({ 'members.userId': req.user._id });
    }

    if (!team) {
      return res.json({
        success: true,
        hasTeam: false,
        team: null
      });
    }

    // Get member stats (sales and products count)
    const memberStats = {};
    for (const member of team.members) {
      const salesCount = await Sale.countDocuments({ soldBy: member.userId });
      const productsCount = await Product.countDocuments({ userId: member.userId });

      memberStats[member._id] = {
        salesCount,
        productsCount
      };
    }

    // Update team member stats
    team.members = team.members.map(member => ({
      ...member.toObject(),
      salesCount: memberStats[member._id]?.salesCount || 0,
      productsCount: memberStats[member._id]?.productsCount || 0
    }));

    res.json({
      success: true,
      hasTeam: true,
      team,
      isOwner: team.ownerId.toString() === req.user._id.toString()
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team'
    });
  }
});

// @route   POST /api/teams/members
// @desc    Add a member to the team
// @access  Private (Team owners only)
router.post('/members', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
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

    const { name, email } = req.body;

    // Find user's team
    const team = await Team.findOne({ ownerId: req.user._id });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'You need to create a team first'
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    let userId = existingUser ? existingUser._id : null;

    // Add member to team
    await team.addMember({
      userId,
      name,
      email: email.toLowerCase(),
      role: 'member'
    });

    res.json({
      success: true,
      message: 'Team member added successfully',
      member: team.members[team.members.length - 1]
    });
  } catch (error) {
    console.error('Add team member error:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding team member'
    });
  }
});

// @route   DELETE /api/teams/members/:memberId
// @desc    Remove a member from the team
// @access  Private (Team owners only)
router.delete('/members/:memberId', auth, async (req, res) => {
  try {
    const { memberId } = req.params;

    // Find user's team
    const team = await Team.findOne({ ownerId: req.user._id });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Remove member
    await team.removeMember(memberId);

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing team member'
    });
  }
});

// @route   GET /api/teams/stats
// @desc    Get team statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Find user's team (as owner or member)
    let team = await Team.findOne({ ownerId: req.user._id });
    if (!team) {
      team = await Team.findOne({ 'members.userId': req.user._id });
    }

    if (!team) {
      return res.json({
        success: true,
        hasTeam: false,
        stats: null
      });
    }

    // Get team stats
    const totalMembers = team.members.length;
    const activeMembers = team.members.filter(m => m.status === 'active').length;

    // Get sales and products counts for all team members
    let totalSales = 0;
    let totalProducts = 0;

    for (const member of team.members) {
      if (member.userId) {
        const salesCount = await Sale.countDocuments({ soldBy: member.userId });
        const productsCount = await Product.countDocuments({ userId: member.userId });
        totalSales += salesCount;
        totalProducts += productsCount;
      }
    }

    // Get current user's stats
    const currentMember = team.members.find(m => m.userId && m.userId.toString() === req.user._id.toString());
    const mySales = currentMember ? await Sale.countDocuments({ soldBy: req.user._id }) : 0;
    const myProducts = currentMember ? await Product.countDocuments({ userId: req.user._id }) : 0;

    res.json({
      success: true,
      hasTeam: true,
      stats: {
        teamName: team.teamName,
        totalMembers,
        activeMembers,
        totalSales,
        totalProducts,
        mySales,
        myProducts,
        isOwner: team.ownerId.toString() === req.user._id.toString()
      }
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team stats'
    });
  }
});

module.exports = router;
