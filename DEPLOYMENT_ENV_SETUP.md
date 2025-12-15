# Environment Variables Setup for Deployment

## Backend Environment Variables (Render/Railway)

Set these environment variables in your Render/Railway dashboard:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secure-jwt-secret-key-here-make-it-long-and-random
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
CLIENT_URL=https://your-vercel-app.vercel.app

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Frontend Environment Variables (Vercel)

Set these environment variables in your Vercel dashboard:

```
REACT_APP_API_URL=https://your-render-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

## Step-by-Step Setup

### 1. MongoDB Atlas Setup
1. Create a cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get connection string and update MONGODB_URI

### 2. Backend Deployment (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set Root Directory: `backend`
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add all environment variables listed above
7. Deploy

### 3. Frontend Deployment (Vercel)
1. Import GitHub repository
2. Set Root Directory: `frontend`
3. Set Build Command: `npm install && npm run build`
4. Set Output Directory: `build`
5. Add REACT_APP_API_URL and REACT_APP_SOCKET_URL
6. Deploy

### 4. Update URLs
After deployment:
1. Update CLIENT_URL in backend with your Vercel URL
2. Update REACT_APP_API_URL in frontend with your Render URL
3. Redeploy both services

## Troubleshooting

### Login/Signup Errors

1. **"Unable to connect to server"**
   - Check if REACT_APP_API_URL is set correctly in Vercel (should be `https://your-render-app.onrender.com/api`)
   - Verify backend is running and accessible
   - Check browser network tab for failed requests

2. **"CORS error"**
   - Ensure CLIENT_URL in backend matches your Vercel domain exactly (include https://)
   - Check if backend CORS is configured for production
   - Try redeploying backend after setting CLIENT_URL

3. **"Invalid email or password"**
   - Verify MongoDB connection is working in backend logs
   - Check JWT_SECRET is set in backend (must be a secure random string)
   - Ensure user passwords are properly hashed

4. **Database connection errors**
   - Verify MONGODB_URI format (should start with mongodb+srv://)
   - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for all access)
   - Ensure database user has read/write permissions
   - Check if database name exists in MongoDB Atlas

5. **"Server error during login/registration"**
   - Check backend logs for detailed error messages
   - Verify all required environment variables are set
   - Ensure MongoDB connection is stable

## Local Development

For local development, create `.env` files:

### backend/.env
```
NODE_ENV=development
PORT=5000
JWT_SECRET=your-local-jwt-secret
MONGODB_URI=mongodb://localhost:27017/business-automation
CLIENT_URL=http://localhost:3000
```

### frontend/.env
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```
