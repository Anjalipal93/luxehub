const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/communication', require('./routes/chatbot'));
app.use('/api/customer-messages', require('./routes/customerMessages'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/inviteCollaborators'));
app.use('/api', require('./routes/teamPerformance'));
app.use('/api', require('./routes/sms'));
app.use('/api', require('./routes/productQR'));

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.room).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection (UPDATED)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Default route to avoid "Not Found"
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
