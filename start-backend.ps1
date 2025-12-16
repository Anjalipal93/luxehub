# Backend Server Startup Script
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\server.js")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "WARNING: backend\.env file not found!" -ForegroundColor Yellow
    Write-Host "Creating a basic .env file..." -ForegroundColor Yellow
    @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/business-automation
JWT_SECRET=your-secret-key-change-this-in-production
CLIENT_URL=https://luxehub-7.onrender.com
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "Created backend\.env file. Please update it with your settings." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
node backend/server.js

