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
  
  // Check all email-related env vars
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
    allEmailVars: allEmailVars,
    envPath: path.join(__dirname, "..", ".env"),
    message: isConfigured 
      ? 'Email configuration is set. Make sure to use Gmail App Password (16 characters), not regular password.'
      : `Email configuration missing. EMAIL_USER: ${hasEmailUser ? 'Set' : 'Not set'}, EMAIL_PASS: ${hasEmailPass ? 'Set' : 'Not set'}. Please set both in .env file and restart the server.`
  });
});

router.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: name, email, and message are required" 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid email format" 
    });
  }

  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email configuration missing:");
    console.error("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
    console.error("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET (hidden)" : "NOT SET");
    console.error("All env vars:", Object.keys(process.env).filter(k => k.includes("EMAIL")));
    
    return res.status(500).json({ 
      success: false, 
      error: "Email service not configured. EMAIL_USER or EMAIL_PASS not set in .env file. Please restart the server after updating .env file." 
    });
  }

  try {
    // Trim whitespace from environment variables
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();
    
    console.log("Creating email transporter with:", {
      user: emailUser,
      pass: emailPass ? "***" + emailPass.slice(-4) : "NOT SET"
    });

    if (!emailUser || !emailPass) {
      throw new Error("EMAIL_USER or EMAIL_PASS is empty after trimming");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Verify transporter configuration
    console.log("Verifying email transporter...");
    await transporter.verify();
    console.log("Email transporter verified successfully!");

    // EMAIL 1 → SENT TO TEAM GROUP
    const teamMailOptions = {
      from: emailUser,
      to: TEAM_VISIBLE.join(", "),      // visible team members
      cc: TEAM_VISIBLE.join(", "),      // optional: visible emails
      bcc: TEAM_HIDDEN.join(", "),      // hidden team members
      subject: `New message from ${name}`,
      text: `
You received a new message:

Sender Name: ${name}
Sender Email: ${email}

Message:
${message}
      `
    };

    await transporter.sendMail(teamMailOptions);
    console.log("Team email sent successfully");

    // EMAIL 2 → CONFIRMATION TO USER
    const userMailOptions = {
      from: emailUser,
      to: email,
      subject: "We received your message",
      text: `
Hi ${name},

Thank you for contacting us.

We have received your message and our team will reply soon.

Your Message:
${message}

Regards,
Your Company Team
      `
    };

    await transporter.sendMail(userMailOptions);
    console.log("User confirmation email sent successfully");

    res.status(200).json({ success: true, message: "Email sent to team + confirmation sent to user!" });

  } catch (error) {
    console.error("Email send error:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to send emails";
    
    if (error.code === 'EAUTH') {
      errorMessage = "Authentication failed. Please check your email credentials in .env file.";
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = "Connection error. Please check your internet connection.";
    } else if (error.response) {
      errorMessage = `Email service error: ${error.response}`;
    } else if (error.message) {
      errorMessage = `Email error: ${error.message}`;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

