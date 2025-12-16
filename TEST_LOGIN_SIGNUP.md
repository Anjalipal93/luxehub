# Testing Login and Signup

## Step 1: Start Backend Server

Open a PowerShell/Command Prompt window and run:
```bash
cd "D:\new automation"
npm run server
```

Wait until you see:
```
Server running on port 5000
MongoDB Connected Successfully
```

## Step 2: Start Frontend (if not already running)

Open another PowerShell/Command Prompt window and run:
```bash
cd "D:\new automation"
npm run client
```

## Step 3: Test the Application

1. Open your browser and go to: https://luxehub-7.onrender.com
2. Navigate to: https://luxehub-7.onrender.com/register
3. Fill in the registration form:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: +1234567890
   - Password: Test123!@#
   - Confirm Password: Test123!@#
4. Click "Create Account"
5. You should be redirected to the dashboard

## Step 4: Test Login

1. Logout (if logged in)
2. Go to: https://luxehub-7.onrender.com/login
3. Enter:
   - Email: test@example.com
   - Password: Test123!@#
4. Click "Sign In"
5. You should be redirected to the dashboard

## Troubleshooting

### If you see "Unable to connect to server":

1. **Check if backend is running:**
   - Open: https://luxehub-7.onrender.com
   - You should see a JSON response with server info

2. **Check backend console:**
   - Look at the terminal where you ran `npm run server`
   - Check for any error messages

3. **Check MongoDB:**
   - The server will start even without MongoDB, but login/signup won't work
   - Make sure MongoDB is running or use MongoDB Atlas

### Common Errors:

- **"User already exists"**: The email is already registered. Try a different email or login instead.
- **"Invalid email or password"**: Check your credentials or register a new account.
- **"Password must be at least 6 characters"**: Use a longer password.
- **"Please choose a stronger password"**: Password needs uppercase, lowercase, numbers, and symbols.

## API Testing

You can test the API directly using curl or Postman:

### Register:
```bash
curl -X POST https://luxehub-7.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!@#","phone":"+1234567890"}'
```

### Login:
```bash
curl -X POST https://luxehub-7.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## Console Logs

Open your browser's Developer Console (F12) to see:
- API requests being made
- Any error messages
- Response data

The code now includes detailed logging to help debug issues.

