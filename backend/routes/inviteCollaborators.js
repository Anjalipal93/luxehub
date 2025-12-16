const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// Import the database model
const CollaboratorInvite = require('../models/CollaboratorInvite');

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
      console.log('Invite collaborator request received:', {
        user: req.user?.email || req.user?.name,
        email: req.body.email
      });

      // Debug environment variables
      console.log('Environment check - EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
      console.log('Environment check - EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: errors.array()[0]?.msg || 'Validation error',
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Check if already invited (pending or accepted)
      const existingInvite = await CollaboratorInvite.findOne({
        email: email.toLowerCase(),
        status: { $in: ['Pending', 'Accepted'] },
        expiresAt: { $gt: new Date() },
      });

      if (existingInvite) {
        return res.status(400).json({
          success: false,
          message: 'An invitation has already been sent to this email address.',
        });
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');

      // Create new invitation
      const newInvite = new CollaboratorInvite({
        email: email.toLowerCase(),
        invitedBy: req.user._id,
        ownerId: req.user._id,
        token: token,
      });

      await newInvite.save();

      // Send real-time email invitation
      let emailSent = false;
      let emailError = null;
      
      try {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPass = process.env.EMAIL_PASS?.trim();

        console.log('Email Debug - EMAIL_USER:', emailUser ? 'Set' : 'Not set');
        console.log('Email Debug - EMAIL_PASS:', emailPass ? 'Set' : 'Not set');
        console.log('Email Debug - CLIENT_URL:', process.env.CLIENT_URL || 'Not set');

        if (!emailUser || !emailPass) {
          console.warn('Email credentials not configured. EMAIL_USER or EMAIL_PASS missing.');
          emailError = 'Email service not configured. Please configure EMAIL_USER and EMAIL_PASS in .env file.';
        } else {
          console.log('Creating email transporter for invitation...');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          // Verify transporter
          await transporter.verify();
          console.log('Email transporter verified successfully');

          // Create invitation link (you can customize this)
          const inviteLink = `${process.env.CLIENT_URL || 'https://luxehub-7.onrender.com'}/register?invite=${newInvite.token}`;

          const mailOptions = {
            from: emailUser,
            to: email,
            subject: `You're Invited to Collaborate - ${req.user.name || 'Team Member'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">Collaboration Invitation</h2>
                <p>Hello,</p>
                <p><strong>${req.user.name || 'A team member'}</strong> has invited you to collaborate on their project.</p>
                <p>You've been invited to join as a collaborator. Click the button below to accept the invitation and create your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" 
                     style="background-color: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Accept Invitation
                  </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${inviteLink}</p>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            `,
            text: `
Collaboration Invitation

Hello,

${req.user.name || 'A team member'} has invited you to collaborate on their project.

You've been invited to join as a collaborator. Click the link below to accept the invitation and create your account:

${inviteLink}

If you didn't expect this invitation, you can safely ignore this email.

This is an automated message. Please do not reply to this email.
            `,
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
          console.log(`Invitation email sent successfully to ${email}`);
        }
      } catch (emailSendError) {
        console.error('Error sending invitation email:', emailSendError);
        emailError = emailSendError.message || 'Failed to send email';
        
        // Provide more specific error messages
        if (emailSendError.code === 'EAUTH') {
          emailError = 'Email authentication failed. Please check EMAIL_USER and EMAIL_PASS in .env file.';
        } else if (emailSendError.code === 'ECONNECTION' || emailSendError.code === 'ETIMEDOUT') {
          emailError = 'Email connection error. Please check your internet connection.';
        }
      }

      // Return success even if email failed, but include email status
      const message = emailSent 
        ? 'Invitation sent successfully! Email notification has been sent.'
        : emailError
        ? `Invitation saved but email failed: ${emailError}`
        : 'Invitation saved successfully. Email notification could not be sent.';

      res.json({
        success: true,
        message: message,
        collaborator: newInvite,
        emailSent: emailSent,
        emailError: emailError || null,
      });
    } catch (error) {
      console.error('Invite collaborator error:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Server error while sending invitation';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/invite-collaborators
// @desc    Get list of invited collaborators
// @access  Private
router.get('/invite-collaborators', auth, async (req, res) => {
  try {
    const collaborators = await CollaboratorInvite.find({
      invitedBy: req.user._id,
    })
      .populate('invitedBy', 'name email')
      .populate('acceptedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      collaborators: collaborators,
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

