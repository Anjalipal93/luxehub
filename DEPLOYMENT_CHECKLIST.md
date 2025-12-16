# Deployment Checklist - Fix Registration Error

## Required Environment Variables on Render

Make sure you have set ALL of these environment variables in your Render backend service:

### 🔴 CRITICAL (Required for Registration to Work)

1. **MONGODB_URI**
   - Your MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - ⚠️ **Without this, registration will fail!**

2. **JWT_SECRET**
   - A long, random string for signing JWT tokens
   - Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - ⚠️ **Without this, registration will fail!**

3. **NODE_ENV**
   - Set to: `production`
   - This ensures proper CORS and error handling

4. **CLIENT_URL**
   - Your Vercel frontend URL
   - Example: `https://luxehub-9uj1-git-main-anjalis-projects-dfe083e8.vercel.app`
   - Or your main domain if you have one

### 🟡 OPTIONAL (But Recommended)

5. **PORT**
   - Usually set automatically by Render
   - Default: `10000` (Render's default)

6. **EMAIL_USER** (Optional)
   - Gmail address for sending emails
   - Only needed if you want email features

7. **EMAIL_PASS** (Optional)
   - Gmail app password
   - Only needed if you want email features

## How to Set Environment Variables on Render

1. Go to https://dashboard.render.com
2. Click on your backend service (luxehub-7)
3. Click on **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"**
5. Add each variable one by one
6. Click **"Save Changes"**
7. **Redeploy** your service (Render will auto-redeploy after saving)

## Common Registration Errors & Solutions

### Error: "Server error during registration"

**Possible Causes:**
1. ❌ **MONGODB_URI not set** → Set it in Render environment variables
2. ❌ **JWT_SECRET not set** → Set it in Render environment variables
3. ❌ **MongoDB connection failed** → Check your MongoDB Atlas connection string
4. ❌ **MongoDB IP whitelist** → Make sure `0.0.0.0/0` is allowed in MongoDB Atlas

### Error: "Database connection error"

**Solution:**
- Check MongoDB Atlas:
  1. Go to https://cloud.mongodb.com
  2. Click "Network Access"
  3. Add IP: `0.0.0.0/0` (allows all IPs)
  4. Verify your connection string is correct

### Error: "Server configuration error"

**Solution:**
- JWT_SECRET is missing
- Set it in Render environment variables

## Testing After Deployment

1. **Check Render Logs:**
   - Go to your Render service
   - Click "Logs" tab
   - Look for: `✅ MongoDB connected successfully`
   - If you see `❌ MongoDB connection error`, fix your MONGODB_URI

2. **Test Registration:**
   - Go to your Vercel frontend
   - Try to register a new user
   - Check browser console for errors
   - Check Render logs for backend errors

3. **Verify Environment Variables:**
   ```bash
   # In Render logs, you should see (if logging is enabled):
   # - MongoDB connected
   # - Server running on port X
   # - No JWT_SECRET errors
   ```

## Quick Fix Checklist

- [ ] MONGODB_URI is set in Render
- [ ] JWT_SECRET is set in Render
- [ ] NODE_ENV is set to "production"
- [ ] CLIENT_URL is set to your Vercel URL
- [ ] MongoDB Atlas IP whitelist allows 0.0.0.0/0
- [ ] Backend service has been redeployed after setting variables
- [ ] Checked Render logs for connection errors

## Still Having Issues?

1. **Check Render Logs** - Look for specific error messages
2. **Check MongoDB Atlas** - Verify connection string and network access
3. **Test MongoDB Connection** - Use MongoDB Compass or mongo shell
4. **Verify Environment Variables** - Double-check all variables are set correctly

