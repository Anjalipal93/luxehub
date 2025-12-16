# How to Start the Backend Server

## Quick Start

### Option 1: Using npm script (Recommended)
```bash
# From the project root directory
npm run server
```

### Option 2: Direct Node command
```bash
# From the project root directory
node backend/server.js
```

### Option 3: Using nodemon (auto-restart on changes)
```bash
# From the project root directory
npx nodemon backend/server.js
```

## What to Expect

When the server starts successfully, you should see:
```
Server running on port 5000
MongoDB Connected Successfully
```

## Troubleshooting

### 1. Port 5000 Already in Use
If you see an error like "EADDRINUSE: address already in use :::5000":
- Find and stop the process using port 5000:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :5000
  # Then kill the process using the PID shown
  taskkill /PID <PID> /F
  ```

### 2. MongoDB Connection Error
The server will still start even if MongoDB is not connected, but some features won't work.

**For local MongoDB:**
- Make sure MongoDB is running:
  ```bash
  # Windows
  net start MongoDB
  ```

**For MongoDB Atlas:**
- Update `backend/.env` with your MongoDB Atlas connection string:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
  ```

### 3. Missing Dependencies
If you see "Cannot find module" errors:
```bash
npm install
```

### 4. Environment Variables
Make sure `backend/.env` file exists with at minimum:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/business-automation
JWT_SECRET=your-secret-key-here
CLIENT_URL=https://luxehub-7.onrender.com
```

## Verify Server is Running

1. Open your browser and go to: https://luxehub-7.onrender.com
2. You should see: "Backend is running successfully!"
3. Or test the API: https://luxehub-7.onrender.com/api/auth/login (should return an error, but confirms server is running)

## Running Both Frontend and Backend

To run both servers together:
```bash
npm run dev
```

This will start:
- Backend on https://luxehub-7.onrender.com
- Frontend on https://luxehub-7.onrender.com

