const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || "*"
      : ["https://luxehub-7.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// =======================
// In-memory chat storage
// =======================
const onlineUsers = new Map();
const messages = [];
const MAX_HISTORY = 200;

// =======================
// Middleware
// =======================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          process.env.CLIENT_URL,
          process.env.CLIENT_URL?.replace('https://', 'http://'),
        ].filter(Boolean);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        } else {
          return callback(new Error(`CORS blocked: ${origin}`));
        }
      } else {
        const allowedOrigins = ["https://luxehub-7.onrender.com"];
        return allowedOrigins.includes(origin)
          ? callback(null, true)
          : callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// Routes
// =======================
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
app.use('/api/teams', require('./routes/team'));
app.use('/api/chat', require('./routes/chat'));

// // 🔴 FIXED HERE (ONLY CHANGE)
// app.use('/api/activity-log', require('./routes/activityLogger'));

app.use('/api', require('./routes/email'));

// =======================
// Socket.IO logic
// =======================
const ChatMessage = require('./models/ChatMessage');

// Map to store socket.id -> userId mapping for quick lookups
const socketToUserId = new Map();
const userIdToSockets = new Map(); // userId -> Set of socketIds

// Helper function to broadcast online users list
function broadcastOnlineUsers() {
  const onlineUsersList = Array.from(userIdToSockets.keys()).map(userId => {
    // Find username from any socket of this user
    let username = 'Unknown';
    const userSockets = userIdToSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      const firstSocketId = Array.from(userSockets)[0];
      const socket = io.sockets.sockets.get(firstSocketId);
      if (socket && socket.username) {
        username = socket.username;
      } else {
        const userInfo = Array.from(onlineUsers.values()).find(u => u.userId === userId);
        if (userInfo) username = userInfo.username;
      }
    }
    return { userId, username };
  });

  io.emit('users', onlineUsersList);
  console.log(`Broadcasted ${onlineUsersList.length} online users`);
}

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('join', async ({ userId, username }) => {
    if (!userId || !username) {
      console.log('Invalid join data:', { userId, username });
      return;
    }

    const userIdStr = String(userId);
    
    // Store mappings
    onlineUsers.set(socket.id, { userId: userIdStr, username, socketId: socket.id });
    socketToUserId.set(socket.id, userIdStr);
    socket.userId = userIdStr;
    socket.username = username;

    // Add socket to user's socket set
    if (!userIdToSockets.has(userIdStr)) {
      userIdToSockets.set(userIdStr, new Set());
    }
    userIdToSockets.get(userIdStr).add(socket.id);

    console.log(`User ${username} (${userIdStr}) joined with socket ${socket.id}`);

    // Broadcast updated online users list
    broadcastOnlineUsers();

    socket.emit('joined', { userId: userIdStr, username });
  });

  // Handle private messages
  socket.on('privateMessage', async ({ toUserId, text }) => {
    try {
      if (!socket.userId || !toUserId || !text) {
        console.log('Invalid privateMessage data:', { fromUserId: socket.userId, toUserId, text });
        return;
      }

      const fromUserId = socket.userId;
      const toUserIdStr = String(toUserId);
      const fromUserIdStr = String(fromUserId);

      console.log(`Private message from ${fromUserIdStr} to ${toUserIdStr}: ${text}`);

      // Save message to database
      const chatMessage = new ChatMessage({
        fromUserId: new mongoose.Types.ObjectId(fromUserIdStr),
        toUserId: new mongoose.Types.ObjectId(toUserIdStr),
        text: text.trim(),
        delivered: false,
        read: false,
      });

      await chatMessage.save();
      console.log('Message saved to database:', chatMessage._id);

      // Prepare message object for clients
      const messageData = {
        id: chatMessage._id.toString(),
        text: chatMessage.text,
        fromUserId: fromUserIdStr,
        fromUsername: socket.username,
        toUserId: toUserIdStr,
        ts: chatMessage.createdAt,
        timestamp: chatMessage.createdAt,
      };

      // Send to sender (confirmation)
      socket.emit('privateMessage', messageData);

      // Send to recipient if online
      const recipientSockets = userIdToSockets.get(toUserIdStr);
      let delivered = false;
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach(socketId => {
          const recipientSocket = io.sockets.sockets.get(socketId);
          if (recipientSocket) {
            recipientSocket.emit('privateMessage', messageData);
            delivered = true;
            console.log(`Message delivered to recipient socket ${socketId}`);
          }
        });
      } else {
        console.log(`Recipient ${toUserIdStr} is not online`);
      }

      // Update delivery status
      if (delivered) {
        await ChatMessage.findByIdAndUpdate(chatMessage._id, { delivered: true });
      }
    } catch (error) {
      console.error('Error handling privateMessage:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ toUserId, typing }) => {
    try {
      if (!socket.userId || !toUserId) return;

      const fromUserId = socket.userId;
      const toUserIdStr = String(toUserId);

      // Send typing indicator to recipient
      const recipientSockets = userIdToSockets.get(toUserIdStr);
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach(socketId => {
          const recipientSocket = io.sockets.sockets.get(socketId);
          if (recipientSocket) {
            recipientSocket.emit('typing', {
              fromUserId,
              fromUsername: socket.username,
              typing,
            });
          }
        });
      }
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  });

  socket.on('disconnect', () => {
    const userId = socketToUserId.get(socket.id);
    
    if (userId) {
      // Remove socket from user's socket set
      const userSockets = userIdToSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userIdToSockets.delete(userId);
        }
      }
    }

    onlineUsers.delete(socket.id);
    socketToUserId.delete(socket.id);

    console.log(`Socket ${socket.id} disconnected`);

    // Broadcast updated online users list
    broadcastOnlineUsers();
  });
});

app.set('io', io);

// =======================
// MongoDB
// =======================
(async function connectDB() {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/ai-automation';

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
})();

// =======================
// Health
// =======================
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// =======================
// Server
// =======================
const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
