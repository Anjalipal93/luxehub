const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { logAuthActivity } = require('../services/activityLogger');
const emailService = require('../services/emailService');

const CollaboratorInvite = require('../models/CollaboratorInvite');
const Team = require('../models/Team');
const Notification = require('../models/Notification');

const router = express.Router();

// ===============================
// JWT GENERATOR
// ===============================
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ===============================
// REGISTER
// ===============================
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { name, email, password, phone } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      // ✅ FIX APPLIED HERE
      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'user',
        isActive: true,
      });

      let inviteData = null;
      const inviteToken = req.query.invite;

      if (inviteToken) {
        const invite = await CollaboratorInvite.findOne({
          token: inviteToken,
          status: 'Pending',
          expiresAt: { $gt: new Date() },
        }).populate('invitedBy', 'name email');

        if (!invite) {
          return res.status(400).json({ success: false, message: 'Invalid or expired invitation token.' });
        }

        if (invite.email !== email.toLowerCase()) {
          return res.status(400).json({ success: false, message: 'This invitation is for a different email address.' });
        }

        user.ownerId = invite.invitedBy._id;
        user.role = 'employee';
        inviteData = invite;
      }

      await user.save();

      if (inviteData) {
        inviteData.status = 'Accepted';
        inviteData.acceptedAt = new Date();
        inviteData.acceptedBy = user._id;
        await inviteData.save();

        try {
          let team = await Team.findOne({ ownerId: inviteData.invitedBy._id });
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

          await Notification.create({
            user: inviteData.invitedBy._id,
            type: 'new_message',
            title: 'Collaborator Joined',
            message: `${user.name} (${user.email}) accepted your invitation.`,
            link: '/invite-collaborators',
            metadata: { collaboratorId: user._id },
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
      return res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// ===============================
// LOGIN (UNCHANGED)
// ===============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

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
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ===============================
// FORGOT PASSWORD
// ===============================
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour from now)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send email
    const emailSubject = 'Password Reset Request';
    const emailText = `You requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10A37F;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #10A37F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `;

    const emailResult = await emailService.sendEmail(user.email, emailSubject, emailText, emailHtml);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult);
      // Clear the token if email failed
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset request' });
  }
});

// ===============================
// RESET PASSWORD
// ===============================
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { token, email, password } = req.body;

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new one.'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send confirmation email
    const emailSubject = 'Password Reset Successful';
    const emailText = `Your password has been successfully reset. If you did not make this change, please contact support immediately.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10A37F;">Password Reset Successful</h2>
        <p>Hello ${user.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      </div>
    `;

    await emailService.sendEmail(user.email, emailSubject, emailText, emailHtml);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

module.exports = router;
