const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { logAuthActivity } = require('../services/activityLogger');

// Models
const CollaboratorInvite = require('../models/CollaboratorInvite');
const Team = require('../models/Team');
const Notification = require('../models/Notification');

const router = express.Router();

// ===============================
// JWT GENERATOR
// ===============================
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// ===============================
// REGISTER
// ===============================
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { name, email, password, phone } = req.body;

      // ===============================
      // CHECK USER EXISTS
      // ===============================
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // ===============================
      // CREATE USER FIRST (FIX)
      // ===============================
      const user = new User({
  name,
  email: email.toLowerCase(),
  password,
  phone,
  role: 'admin',
});


      // ===============================
      // INVITE HANDLING (?invite=TOKEN)
      // ===============================
      let inviteData = null;
      const inviteToken = req.query.invite;

      if (inviteToken) {
        const invite = await CollaboratorInvite.findOne({
          token: inviteToken,
          status: 'Pending',
          expiresAt: { $gt: new Date() },
        }).populate('invitedBy', 'name email');

        if (!invite) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired invitation token.',
          });
        }

        if (invite.email !== email.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: 'This invitation is for a different email address.',
          });
        }

        // Apply collaborator settings
        user.ownerId = invite.invitedBy._id;
        user.role = 'employee';

        inviteData = invite;
      }

      // ===============================
      // SAVE USER (FIXED)
      // ===============================
      await user.save();

      // ===============================
      // HANDLE INVITE ACCEPTANCE
      // ===============================
      if (inviteData) {
        inviteData.status = 'Accepted';
        inviteData.acceptedAt = new Date();
        inviteData.acceptedBy = user._id;
        await inviteData.save();

        try {
          let team = await Team.findOne({
            ownerId: inviteData.invitedBy._id,
          });

          if (!team) {
            team = new Team({
              teamName: `${inviteData.invitedBy.name}'s Team`,
              ownerId: inviteData.invitedBy._id,
              ownerName: inviteData.invitedBy.name,
              ownerEmail: inviteData.invitedBy.email,
              members: [],
            });
          }

          await team.addMember({
            userId: user._id,
            name: user.name,
            email: user.email,
            role: 'member',
            status: 'active',
          });

          await team.save();

          // Notification
          await Notification.create({
            user: inviteData.invitedBy._id,
            type: 'new_message',
            title: 'Collaborator Joined',
            message: `${user.name} (${user.email}) accepted your invitation.`,
            link: '/invite-collaborators',
            metadata: {
              collaboratorId: user._id,
            },
          });
        } catch (err) {
          console.error('Invite post-processing error:', err);
        }
      }

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          ownerId: user.ownerId || null,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration',
      });
    }
  }
);

// ===============================
// LOGIN
// ===============================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
      });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const tempReq = {
        user,
        ip: req.ip,
        connection: req.connection,
        get: req.get,
      };

      await logAuthActivity(
        tempReq,
        'login',
        'User logged into the system'
      );

      const token = generateToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ownerId: user.ownerId || null,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login',
      });
    }
  }
);

// ===============================
// CURRENT USER
// ===============================
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        ownerId: req.user.ownerId || null,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
