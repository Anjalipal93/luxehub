# ✅ Deployment Checklist

Follow these steps in order:

## Pre-Deployment
- [ ] Code is working locally
- [ ] All features tested
- [ ] No console errors
- [ ] `.env` files are NOT committed (in .gitignore)

## Step 1: GitHub Setup
- [ ] Created GitHub account
- [ ] Created new repository
- [ ] Pushed code to GitHub
- [ ] Verified code is on GitHub

## Step 2: MongoDB Atlas
- [ ] Created MongoDB Atlas account
- [ ] Created FREE cluster
- [ ] Created database user (saved password!)
- [ ] Whitelisted IP (0.0.0.0/0)
- [ ] Copied connection string
- [ ] Tested connection string locally

## Step 3: Backend Deployment (Render)
- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created Web Service
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `node server.js`
- [ ] Added MONGODB_URI
- [ ] Added JWT_SECRET (32+ characters)
- [ ] Added CLIENT_URL (will update later)
- [ ] Deployed successfully
- [ ] Copied backend URL
- [ ] Tested: https://your-backend.onrender.com/health

## Step 4: Frontend Deployment (Vercel)
- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Set Root Directory: `frontend`
- [ ] Set Framework: Create React App
- [ ] Added REACT_APP_API_URL
- [ ] Deployed successfully
- [ ] Copied frontend URL

## Step 5: Final Configuration
- [ ] Updated CLIENT_URL in Render with Vercel URL
- [ ] Redeployed backend
- [ ] Tested frontend can connect to backend

## Step 6: Testing
- [ ] Can access frontend URL
- [ ] Can register new user
- [ ] Can login
- [ ] Can create products
- [ ] Can make sales
- [ ] Socket.IO messages work
- [ ] No console errors

## Optional: Email Setup
- [ ] Enabled Gmail 2FA
- [ ] Generated App Password
- [ ] Added SMTP variables to Render
- [ ] Tested forgot password email

## 🎉 Done!
Your app is live and working!





