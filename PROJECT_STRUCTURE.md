# Project Structure

## Overview

This is a full-stack MERN application with AI-powered features for business automation.

```
ai-powered-automation-business/
├── backend/                 # Node.js/Express backend
│   ├── middleware/         # Authentication middleware
│   ├── models/             # MongoDB Mongoose models
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable components
│       ├── context/       # React context providers
│       └── pages/         # Page components
├── package.json            # Root package.json
├── README.md              # Main documentation
├── QUICKSTART.md          # Quick start guide
├── DEPLOYMENT.md          # Deployment instructions
└── .gitignore            # Git ignore rules
```

## Backend Structure

### Models (`backend/models/`)
- **User.js** - User authentication and profile
- **Product.js** - Product and inventory management
- **Sale.js** - Sales transactions
- **Message.js** - Communication messages (email, WhatsApp, web)
- **Notification.js** - System notifications

### Routes (`backend/routes/`)
- **auth.js** - Authentication (login, register, profile)
- **users.js** - User management (CRUD operations)
- **products.js** - Product management (CRUD, low stock alerts)
- **sales.js** - Sales management (create, view, statistics)
- **ai.js** - AI forecasting and suggestions
- **communication.js** - Email, WhatsApp, web chat
- **dashboard.js** - Dashboard statistics and charts
- **notifications.js** - Notification management

### Services (`backend/services/`)
- **aiForecast.js** - AI forecasting algorithms (exponential smoothing)
- **emailService.js** - Email sending via Nodemailer
- **whatsappService.js** - WhatsApp messaging via Twilio

### Middleware (`backend/middleware/`)
- **auth.js** - JWT authentication and role-based access control

## Frontend Structure

### Pages (`frontend/src/pages/`)
- **Login.js** - User login page
- **Register.js** - User registration page
- **Dashboard.js** - Main dashboard with statistics and charts
- **Products.js** - Product management interface
- **Sales.js** - Sales recording and viewing
- **AIForecast.js** - AI forecasting and analytics
- **Communication.js** - Multichannel communication interface
- **Users.js** - User management (admin only)

### Components (`frontend/src/components/`)
- **Layout.js** - Main application layout with sidebar
- **PrivateRoute.js** - Protected route wrapper

### Context (`frontend/src/context/`)
- **AuthContext.js** - Authentication state management

## Key Features by Module

### 1. User Management & Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access (admin, employee, user)
- Session management

### 2. Product & Inventory Management
- CRUD operations for products
- Automatic inventory updates
- Low stock alerts
- Category and brand management

### 3. Sales & Transaction Management
- Sales recording with multiple items
- Automatic inventory deduction
- Revenue statistics
- Top-selling products tracking

### 4. AI Forecasting & Analytics
- Exponential smoothing algorithm
- Sales forecasting
- Inventory recommendations
- Confidence levels

### 5. Multichannel Communication
- Web chat (Socket.IO)
- Email (Nodemailer)
- WhatsApp (Twilio)
- Unified message center

### 6. Dashboard & Reporting
- Real-time statistics
- Interactive charts (Recharts)
- Revenue tracking
- Product analytics

### 7. Notification & Alert System
- Real-time notifications
- Low stock alerts
- Sale notifications
- Message notifications

### 8. Role & Access Control
- Admin, Employee, User roles
- Route protection
- Feature-based access

### 9. AI-Powered Decision Support
- Restocking suggestions
- Promotion recommendations
- Slow-moving product alerts

### 10. Cloud-Ready Deployment
- Environment variable configuration
- MongoDB Atlas support
- Render/Railway deployment ready
- Vercel frontend deployment

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO
- JWT
- bcryptjs
- Nodemailer
- Twilio

### Frontend
- React
- React Router
- Material-UI
- Recharts
- Axios
- Socket.IO Client
- React Toastify

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-automation
JWT_SECRET=your-secret-key
CLIENT_URL=https://luxehub-7.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Frontend (.env)
```
REACT_APP_API_URL=https://luxehub-7.onrender.com/api
REACT_APP_SOCKET_URL=https://luxehub-7.onrender.com
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/stats/revenue` - Revenue statistics
- `GET /api/sales/stats/top-products` - Top products

### AI
- `GET /api/ai/forecast/sales` - Sales forecasts
- `GET /api/ai/forecast/product/:id` - Product forecast
- `GET /api/ai/suggestions` - AI suggestions

### Communication
- `GET /api/communication/messages` - Get messages
- `POST /api/communication/send-email` - Send email
- `POST /api/communication/send-whatsapp` - Send WhatsApp

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/charts/sales` - Sales chart data
- `GET /api/dashboard/charts/products` - Product chart data

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Development Workflow

1. **Backend Development**
   - Modify routes in `backend/routes/`
   - Update models in `backend/models/`
   - Add services in `backend/services/`

2. **Frontend Development**
   - Create pages in `frontend/src/pages/`
   - Add components in `frontend/src/components/`
   - Update context in `frontend/src/context/`

3. **Testing**
   - Test API endpoints with Postman/Thunder Client
   - Test frontend in browser
   - Check console for errors

4. **Deployment**
   - Follow DEPLOYMENT.md guide
   - Set environment variables
   - Deploy backend first, then frontend

