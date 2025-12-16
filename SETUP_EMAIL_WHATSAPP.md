# Email and WhatsApp Setup Guide

This guide will help you configure both Email (via Google OAuth2) and WhatsApp (via Twilio) services for your application.

## Prerequisites

1. **For Email**: A Google account with Gmail
2. **For WhatsApp**: A Twilio account (sign up at https://www.twilio.com/)

---

## Email Setup - Google OAuth2 (Recommended)

Google OAuth2 is more secure than App Passwords and provides better authentication. Follow these steps:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes: `https://www.googleapis.com/auth/gmail.send`
   - Add test users (your Gmail account) if in testing mode
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "AI Business Hub Email"
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
   - Click "Create"
5. Save your **Client ID** and **Client Secret**

### Step 3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, find "Gmail API v1"
6. Select `https://www.googleapis.com/auth/gmail.send`
7. Click "Authorize APIs"
8. Sign in with your Google account and grant permissions
9. Click "Exchange authorization code for tokens"
10. Copy the **Refresh token** (save it securely!)

### Step 4: Add to Environment Variables

Add these to your `backend/.env` file:

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
SMTP_USER=your-email@gmail.com
```

---

## Email Setup - Alternative: App Password Method

If you prefer using App Passwords instead of OAuth2:

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other" as the device and enter "AI Business Hub"
4. Click "Generate"
5. Copy the 16-character password (save it securely!)

### Step 3: Add to Environment Variables

Add these to your `backend/.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_NAME=AI Business Hub
```

**Note**: The service will use OAuth2 if those credentials are present, otherwise it will use SMTP with App Password.

---

## WhatsApp Setup - Twilio

### Step 1: Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com/)
2. Verify your email and phone number
3. Complete account setup

### Step 2: Get Credentials

1. Go to [Twilio Console Dashboard](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** (visible on the dashboard)
   - Auth Token is hidden by default, click "view" to reveal it

### Step 3: Set Up WhatsApp Sandbox

1. In Twilio Console, go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow the instructions to join the sandbox
3. Send the join code to the number provided (e.g., send "join <code>" to +1 415 523 8886)
4. Note the WhatsApp number provided (usually `whatsapp:+14155238886`)

### Step 4: Add to Environment Variables

Add these to your `backend/.env` file:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## Complete .env Example

Here's a complete example of your `backend/.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai-automation

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server Configuration
PORT=5000
CLIENT_URL=https://luxehub-7.onrender.com

# Email Configuration - Option 1: OAuth2 (Recommended)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
SMTP_USER=your-email@gmail.com

# Email Configuration - Option 2: App Password (Alternative)
# Use this if you're not using OAuth2
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_PASS=your-app-password
# SMTP_FROM_NAME=AI Business Hub

# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## Testing the Configuration

### Install Dependencies

Make sure to install the new `googleapis` package:

```bash
npm install
```

### Check Service Status

After starting your server, you can check the status of both services via API:

1. **Email Status**: `GET /api/communication/email-status`
2. **WhatsApp Status**: `GET /api/communication/whatsapp-status`

Or test them directly in the application's Communication page.

### Test Email Sending

1. Go to the Communication page in your app
2. Select the Email tab
3. Enter recipient email, subject, and message
4. Click "Send Email"
5. Check the response for success/error messages

### Test WhatsApp Sending

1. Go to the Communication page
2. Select the WhatsApp tab
3. Enter phone number (with country code, e.g., +1234567890)
4. Enter message content
5. Click "Send WhatsApp"
6. For sandbox testing, make sure the recipient has joined the Twilio sandbox

---

## Troubleshooting

### Email Issues

**OAuth2 Errors:**
- Make sure all OAuth2 credentials are correct
- Verify the refresh token hasn't expired
- Check that Gmail API is enabled in Google Cloud Console
- Ensure your OAuth consent screen is configured properly

**SMTP Errors:**
- Verify your App Password is correct (16 characters, no spaces)
- Make sure 2FA is enabled on your Google account
- Check that SMTP settings are correct (host, port)

### WhatsApp Issues

**Authentication Errors:**
- Verify Account SID and Auth Token are correct
- Check that your Twilio account is active

**Message Not Sending:**
- For sandbox: Recipient must join the sandbox first
- Verify phone number format: `+1234567890` (with country code)
- Check Twilio console for error logs

**Unverified Number:**
- Twilio sandbox has restrictions
- Upgrade to production to send to any number
- Or add numbers to your verified list

---

## Security Notes

1. **Never commit your `.env` file** to version control
2. Store credentials securely
3. Use OAuth2 for email when possible (more secure than App Passwords)
4. Rotate refresh tokens and app passwords periodically
5. Use environment variables in production (don't hardcode credentials)

---

## Next Steps

- Test sending emails and WhatsApp messages
- Monitor the service status endpoints
- Check logs for any configuration issues
- Set up production Twilio account if needed (for sending to any number)

