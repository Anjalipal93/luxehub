# Deployment Guide

## Backend Deployment (Render/Railway)

### Render Deployment

1. **Create a new Web Service**
   - Connect your GitHub repository
   - Select the repository and branch

2. **Configure Build Settings**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Node

3. **Set Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-secure-jwt-secret-key-here
   CLIENT_URL=https://your-frontend-domain.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Railway Deployment

1. **Create New Project**
   - Connect GitHub repository
   - Select the repository

2. **Configure Service**
   - Root Directory: `backend`
   - Start Command: `node server.js`
   - Build Command: `npm install`

3. **Add Environment Variables**
   - Same as Render (see above)

4. **Add MongoDB Plugin** (Optional)
   - Or use MongoDB Atlas

## Frontend Deployment (Vercel)

1. **Import Project**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## MongoDB Atlas Setup

1. **Create Cluster**
   - Go to MongoDB Atlas
   - Create a free cluster
   - Choose your region

2. **Create Database User**
   - Go to Database Access
   - Create a new user with password
   - Set appropriate permissions

3. **Whitelist IP Address**
   - Go to Network Access
   - Add IP address (0.0.0.0/0 for all, or specific IPs)

4. **Get Connection String**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name

5. **Update Environment Variable**
   - Set `MONGODB_URI` in your backend environment variables

## Email Configuration (Gmail)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Enable 2FA

2. **Generate App Password**
   - Go to Google Account
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Update Environment Variables**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

## WhatsApp Configuration (Twilio)

1. **Create Twilio Account**
   - Sign up at twilio.com
   - Verify your phone number

2. **Get Credentials**
   - Go to Console Dashboard
   - Copy Account SID and Auth Token

3. **Set Up WhatsApp Sandbox**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox
   - Get WhatsApp number

4. **Update Environment Variables**
   ```
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

## Post-Deployment Checklist

- [ ] Backend is accessible and responding
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection is working
- [ ] Authentication is working
- [ ] Email service is configured (optional)
- [ ] WhatsApp service is configured (optional)
- [ ] Socket.IO real-time features are working
- [ ] All environment variables are set correctly

## Troubleshooting

### Backend Issues
- Check logs in Render/Railway dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Check CORS settings match frontend URL

### Frontend Issues
- Verify API URL in environment variables
- Check browser console for errors
- Ensure backend is accessible from frontend domain
- Check CORS configuration on backend

### Database Issues
- Verify MongoDB Atlas IP whitelist
- Check database user permissions
- Ensure connection string is correct
- Check network connectivity

