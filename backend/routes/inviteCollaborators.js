const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for demonstration (replace with database in production)
// In production, you would use a MongoDB model like:
// const CollaboratorInvite = require('../models/CollaboratorInvite');
let collaboratorsList = [
  // Sample data for demonstration
  {
    _id: '1',
    email: 'john.doe@example.com',
    status: 'Pending',
    invitedDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
  },
  {
    _id: '2',
    email: 'jane.smith@example.com',
    status: 'Accepted',
    invitedDate: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
  },
];

// @route   POST /api/invite-collaborator
// @desc    Send invitation to a collaborator
// @access  Private
router.post(
  '/invite-collaborator',
  auth,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Check if already invited
      const existingInvite = collaboratorsList.find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      );

      if (existingInvite) {
        return res.status(400).json({
          success: false,
          message: 'An invitation has already been sent to this email address.',
        });
      }

      // Create new invitation (placeholder - in production, save to database)
      const newInvite = {
        _id: Date.now().toString(),
        email: email.toLowerCase(),
        status: 'Pending',
        invitedDate: new Date(),
        createdAt: new Date(),
        invitedBy: req.user._id, // User who sent the invite
      };

      collaboratorsList.push(newInvite);

      // In production, you would:
      // 1. Save to database:
      //    const invite = new CollaboratorInvite(newInvite);
      //    await invite.save();
      //
      // 2. Send email notification:
      //    await emailService.sendCollaboratorInvite(email, inviteToken);

      res.json({
        success: true,
        message: 'Invitation sent successfully!',
        collaborator: newInvite,
      });
    } catch (error) {
      console.error('Invite collaborator error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending invitation',
      });
    }
  }
);

// @route   GET /api/invite-collaborators
// @desc    Get list of invited collaborators
// @access  Private
router.get('/invite-collaborators', auth, async (req, res) => {
  try {
    // In production, you would fetch from database:
    // const collaborators = await CollaboratorInvite.find()
    //   .populate('invitedBy', 'name email')
    //   .sort({ createdAt: -1 });

    // For now, return the in-memory list
    res.json({
      success: true,
      collaborators: collaboratorsList,
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching collaborators',
    });
  }
});

module.exports = router;

