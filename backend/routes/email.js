const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const path = require("path");

// Load .env file from backend directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Debug: Log environment variables (without showing password)
console.log("Email Route - Environment Check:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✓ Set" : "✗ Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ Set" : "✗ Not set");

// TEAM EMAIL GROUP
const TEAM_VISIBLE = [
  "team1_visible@gmail.com",
  "team2_visible@gmail.com"
];

const TEAM_HIDDEN = [
  "team3_hidden@gmail.com",
  "team4_hidden@gmail.com"
];

// Test endpoint to check email configuration
router.get("/test-email-config", (req, res) => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();
  const hasEmailUser = !!emailUser;
  const hasEmailPass = !!emailPass;
  const isConfigured = hasEmailUser && hasEmailPass;
  
  const allEmailVars = Object.keys(process.env).filter(k => 
    k.includes("EMAIL") || k.includes("SMTP")
  );
  
  res.json({
    configured: isConfigured,
    hasEmailUser,
    hasEmailPass,
    emailUser: emailUser || 'Not set',
    emailPassLength: emailPass ? emailPass.length : 0,
    emailUserLength: emailUser ? emailUser.length : 0,
    allEmailVars,
    envPath: path.join(__dirname, "..", ".env"),
    message: isConfigured 
      ? 'Email configuration is set.'
      : 'Email configuration missing.'
  });
});

router.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields" 
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ 
      success: false, 
      error: "Email service not configured" 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim(),
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: TEAM_VISIBLE.join(", "),
      cc: TEAM_VISIBLE.join(", "),
      bcc: TEAM_HIDDEN.join(", "),
      subject: `New message from ${name}`,
      text: message,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We received your message",
      text: `Thank you ${name}, we received your message.`,
    });

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
