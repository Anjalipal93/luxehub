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

      // Check for existing invites - simplified logic
      console.log('Checking for existing invites for email:', email.toLowerCase());

      // Find the latest invite for this email
      const latestInvite = await CollaboratorInvite.findOne({
        email: email.toLowerCase()
      }).sort({ createdAt: -1 });

      let inviteToUpdate = null;
      let allowNewInvite = true;
      let isResend = false;

      if (latestInvite) {
        console.log('Latest invite details:', {
          id: latestInvite._id,
          status: latestInvite.status,
          expiresAt: latestInvite.expiresAt,
          invitedBy: latestInvite.invitedBy,
          createdAt: latestInvite.createdAt
        });

        // If the invite was accepted, don't allow resending
        if (latestInvite.status === 'Accepted') {
          return res.status(400).json({
            success: false,
            message: 'This user has already accepted an invitation and joined a team.',
            details: {
              status: 'Accepted',
              acceptedAt: latestInvite.acceptedAt
            }
          });
        }

        // If it's from another user, don't allow
        if (latestInvite.invitedBy.toString() !== req.user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'This email address has already been invited by another user.',
          });
        }

        // For pending invites, allow resending with rate limiting
        if (latestInvite.status === 'Pending') {
          const timeSinceLastInvite = Date.now() - latestInvite.createdAt.getTime();
          const oneHourInMs = 60 * 60 * 1000;

          if (timeSinceLastInvite < oneHourInMs) {
            const remainingTime = Math.ceil((oneHourInMs - timeSinceLastInvite) / (60 * 1000));
            return res.status(400).json({
              success: false,
              message: `An invitation was recently sent to this email. Please wait ${remainingTime} minutes before resending.`,
              details: {
                status: 'Pending',
                expiresAt: latestInvite.expiresAt,
                canResendIn: remainingTime
              }
            });
          } else {
            // Allow resending - update the existing invite
            console.log('Will resend existing pending invite');
            inviteToUpdate = latestInvite;
            allowNewInvite = false;
            isResend = true;
          }
        }

        // For expired invites, allow resending
        if (latestInvite.status === 'Pending' && latestInvite.expiresAt <= new Date()) {
          console.log('Latest invite is expired, will resend');
          inviteToUpdate = latestInvite;
          allowNewInvite = false;
          isResend = true;
        }

        // For rejected invites, allow new invite
        if (latestInvite.status === 'Rejected') {
          console.log('Latest invite was rejected, will send new invite');
          allowNewInvite = true;
          isResend = false;
        }
      }

      console.log('inviteToUpdate:', inviteToUpdate ? 'YES' : 'NO');
      console.log('allowNewInvite:', allowNewInvite);
      console.log('isResend:', isResend);

      let newInvite;

      if (inviteToUpdate) {
        // Resend existing invite - generate new token and reset expiry
        const newToken = crypto.randomBytes(32).toString('hex');
        inviteToUpdate.token = newToken;
        inviteToUpdate.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        inviteToUpdate.createdAt = new Date(); // Update creation time for rate limiting
        await inviteToUpdate.save();
        newInvite = inviteToUpdate;
        console.log('Resent existing invite with new token');
      } else if (allowNewInvite) {
        // Generate unique token for new invite
        const token = crypto.randomBytes(32).toString('hex');

        // Create new invitation
        newInvite = new CollaboratorInvite({
          email: email.toLowerCase(),
          invitedBy: req.user._id,
          ownerId: req.user._id,
          token: token,
        });

        await newInvite.save();
        console.log('Created new invite');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unable to send invitation. Please try again later.',
        });
      }

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
          const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?invite=${newInvite.token}`;

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
      const baseMessage = isResend ? 'Invitation resent successfully!' : 'Invitation sent successfully!';

      const message = emailSent
        ? `${baseMessage} Email notification has been sent.`
        : emailError
        ? `${baseMessage} Invitation saved but email failed: ${emailError}`
        : `${baseMessage} Invitation saved successfully. Email notification could not be sent.`;

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

// @route   GET /api/invite-details/:token
// @desc    Get invitation details by token (for registration page)
// @access  Public
router.get('/invite-details/:token', async (req, res) => {
  try {
    const invite = await CollaboratorInvite.findOne({
      token: req.params.token,
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email')
      .select('email status expiresAt invitedBy createdAt');

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token.',
      });
    }

    res.json({
      success: true,
      invite: {
        email: invite.email,
        inviterName: invite.invitedBy.name,
        inviterEmail: invite.invitedBy.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Get invite details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invitation details',
    });
  }
});

// @route   POST /api/resend-invite/:inviteId
// @desc    Manually resend an invitation
// @access  Private
router.post('/resend-invite/:inviteId', auth, async (req, res) => {
  try {
    const invite = await CollaboratorInvite.findOne({
      _id: req.params.inviteId,
      invitedBy: req.user._id,
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    if (invite.status === 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend an accepted invitation.',
      });
    }

    // Check rate limiting (same as in main invite route)
    const timeSinceLastInvite = Date.now() - invite.createdAt.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    if (timeSinceLastInvite < oneHourInMs) {
      const remainingTime = Math.ceil((oneHourInMs - timeSinceLastInvite) / (60 * 1000));
      return res.status(400).json({
        success: false,
        message: `Please wait ${remainingTime} minutes before resending.`,
      });
    }

    // Generate new token and update expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    invite.token = newToken;
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invite.createdAt = new Date();
    await invite.save();

    // Send email (same logic as main invite route)
    let emailSent = false;
    let emailError = null;

    try {
      const emailUser = process.env.EMAIL_USER?.trim();
      const emailPass = process.env.EMAIL_PASS?.trim();

      if (!emailUser || !emailPass) {
        emailError = 'Email service not configured.';
      } else {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.verify();

        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?invite=${invite.token}`;

        const mailOptions = {
          from: emailUser,
          to: invite.email,
          subject: `You're Invited to Collaborate - ${req.user.name || 'Team Member'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563EB;">Collaboration Invitation (Resent)</h2>
              <p>Hello,</p>
              <p><strong>${req.user.name || 'A team member'}</strong> has resent their invitation for you to collaborate on their project.</p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}"
                   style="background-color: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>
              <p>Or copy and paste this link: <span style="color: #666; word-break: break-all;">${inviteLink}</span></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      }
    } catch (emailSendError) {
      console.error('Error resending invitation email:', emailSendError);
      emailError = emailSendError.message || 'Failed to send email';
    }

    const message = emailSent
      ? 'Invitation resent successfully!'
      : `Invitation updated but email failed: ${emailError}`;

    res.json({
      success: true,
      message: message,
      invite: invite,
      emailSent: emailSent,
      emailError: emailError || null,
    });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending invitation',
    });
  }
});

module.exports = router;

