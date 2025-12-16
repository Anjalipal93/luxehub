# Backend Server Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   STARTING BACKEND SERVER" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will run on: https://luxehub-7.onrender.com" -ForegroundColor Green
Write-Host "Keep this window open!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location "D:\new automation"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
node backend/server.js


