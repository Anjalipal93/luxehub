# Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Up Environment Variables

**Backend:**
```bash
# Copy example file
cp backend/.env.example backend/.env

# Edit backend/.env with your configuration
# Minimum required:
# - MONGODB_URI (e.g., mongodb://localhost:27017/ai-automation)
# - JWT_SECRET (any random string)
```

**Frontend:**
```bash
# Copy example file
cd frontend
cp .env.example .env

# Edit frontend/.env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5000
cd ..
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# If MongoDB is installed locally, start it:
# Windows: net start MongoDB
# Mac/Linux: sudo systemctl start mongod
```

**Or use MongoDB Atlas:**
- Create free account at mongodb.com/cloud/atlas
- Create cluster
- Get connection string
- Update MONGODB_URI in backend/.env

### 4. Run the Application

**Option 1: Run both together (recommended)**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### 6. Create First Admin User

1. Go to http://localhost:3000/register
2. Register a new user
3. In MongoDB, update the user's role to 'admin':
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```
4. Or use MongoDB Compass to edit the user document

## First Steps After Login

1. **Add Products**
   - Go to Products page
   - Click "Add Product"
   - Fill in product details

2. **Record a Sale**
   - Go to Sales page
   - Click "New Sale"
   - Select products and quantities

3. **View Dashboard**
   - Check the Dashboard for statistics
   - View charts and analytics

4. **Explore AI Forecast**
   - Go to AI Forecast page
   - View predictions and suggestions

5. **Test Communication**
   - Go to Communication page
   - Try sending emails or WhatsApp messages (if configured)

## Optional: Configure Email & WhatsApp

### Email (Gmail)
1. Enable 2FA on your Google account
2. Generate App Password
3. Add to backend/.env:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### WhatsApp (Twilio)
1. Sign up at twilio.com
2. Get Account SID and Auth Token
3. Set up WhatsApp sandbox
4. Add to backend/.env:
   ```
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

## Troubleshooting

### Port Already in Use
- Change PORT in backend/.env
- Update REACT_APP_API_URL in frontend/.env

### MongoDB Connection Error
- Check MongoDB is running
- Verify MONGODB_URI is correct
- Check network/firewall settings

### CORS Errors
- Ensure CLIENT_URL in backend/.env matches frontend URL
- Default: http://localhost:3000

### Module Not Found
- Run `npm install` in both root and frontend directories
- Delete node_modules and package-lock.json, then reinstall

## Next Steps

- Read the main README.md for detailed documentation
- Check DEPLOYMENT.md for production deployment
- Explore the API endpoints in backend/routes/
- Customize the UI in frontend/src/

