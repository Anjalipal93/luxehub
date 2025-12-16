# AI-Powered Automation for Online Business

A comprehensive MERN stack application that helps businesses streamline operations, improve decision-making, and maintain effective customer communication using artificial intelligence and web-based automation.

## 🚀 Features

### Core Modules

1. **User Management & Authentication** - Secure JWT-based authentication with role-based access
2. **Product & Inventory Management** - Complete product lifecycle with low-stock alerts
3. **Sales & Transaction Management** - Automated sales recording and inventory updates
4. **AI Forecasting & Analytics** - Predictive analytics using exponential smoothing
5. **Multichannel Communication** - Web chat, email, and WhatsApp integration
6. **Dashboard & Reporting** - Comprehensive visual analytics
7. **Notification & Alert System** - Real-time notifications for important events
8. **Role & Access Control** - Admin and employee role management
9. **AI-Powered Decision Support** - Smart suggestions for inventory and promotions
10. **Cloud-Ready Deployment** - Configured for Render, Railway, and Vercel

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "new automation"
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment variables**
```bash
# Copy the example env file
cp backend/.env.example backend/.env

# Edit backend/.env with your configuration
```

5. **Start the development server**
```bash
# Run both backend and frontend
npm run dev

# Or run separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## 🔧 Environment Variables

Create a `backend/.env` file with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-automation
JWT_SECRET=your-secret-key
CLIENT_URL=https://luxehub-7.onrender.com

# Optional: Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/stats/revenue` - Get revenue statistics
- `GET /api/sales/stats/top-products` - Get top selling products

### AI & Analytics
- `GET /api/ai/forecast/sales` - Get sales forecasts
- `GET /api/ai/forecast/product/:id` - Get product forecast
- `GET /api/ai/suggestions` - Get AI-powered suggestions

### Communication
- `GET /api/communication/messages` - Get all messages
- `POST /api/communication/send-email` - Send email
- `POST /api/communication/send-whatsapp` - Send WhatsApp message

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts/sales` - Get sales chart data
- `GET /api/dashboard/charts/products` - Get product chart data

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## 🎨 Frontend

The React frontend will be created in the `frontend` directory with:
- Modern UI using React and Material-UI or Tailwind CSS
- Real-time updates using Socket.IO client
- Interactive charts using Recharts
- Responsive design

## 🚢 Deployment

### Backend (Render/Railway)
1. Connect your repository
2. Set environment variables
3. Build command: `npm install`
4. Start command: `node backend/server.js`

### Frontend (Vercel)
1. Connect your repository
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Output directory: `build`

### Database (MongoDB Atlas)
1. Create a free cluster
2. Get connection string
3. Update `MONGODB_URI` in environment variables

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

