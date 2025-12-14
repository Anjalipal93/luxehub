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
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// =======================
// In-memory chat storage
// =======================
const onlineUsers = new Map(); // socketId → { userId, username, socketId }

const messages = [];
const MAX_HISTORY = 200;

// =======================
// Middleware
// =======================
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
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
app.use('/api/activity-log', require('./routes/activityLog'));
app.use('/api', require('./routes/email'));

// =======================
// Helper
// =======================
function broadcastUserList() {
  const users = Array.from(onlineUsers.values()).map(u => ({
    userId: u.userId,
    username: u.username,
  }));
  io.emit('users', users);
}

// Get all online user IDs
function getOnlineUserIds() {
  return new Set(Array.from(onlineUsers.values()).map(u => u.userId));
}

// =======================
// Socket.IO logic
// =======================
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  // -------- JOIN CHAT --------
  socket.on('join', ({ userId, username }) => {
    if (!userId || !username) return;

    // Store user info with socket ID as key
    onlineUsers.set(socket.id, {
      userId,
      username,
      socketId: socket.id,
    });
    
    socket.userId = userId;
    socket.username = username;

    socket.emit('joined', {
      userId,
      username,
      history: messages,
    });

    broadcastUserList();
    socket.broadcast.emit('systemMessage', `${username} joined the chat`);

    console.log(`User joined: ${username} (${userId})`);
  });

  // -------- PUBLIC MESSAGE --------
  socket.on('message', ({ text, room = null }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender || !text) return;

    const msg = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      fromUserId: sender.userId,
      fromUsername: sender.username,
      text,
      room,
      ts: new Date().toISOString(),
    };

    messages.push(msg);
    if (messages.length > MAX_HISTORY) messages.shift();

    room ? io.to(room).emit('message', msg) : io.emit('message', msg);
  });

  // -------- PRIVATE MESSAGE --------
  socket.on('privateMessage', ({ toUserId, text }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender || !toUserId || !text) {
      console.log('Invalid private message:', { sender: !!sender, toUserId, hasText: !!text });
      return;
    }

    console.log('Private message received:', {
      from: sender.userId,
      to: toUserId,
      text: text.substring(0, 50),
    });

    // Find recipient by userId (handle both string and ObjectId comparisons)
    const recipientEntry = Array.from(onlineUsers.entries()).find(
      ([, info]) => {
        const infoUserId = String(info.userId);
        const targetUserId = String(toUserId);
        return infoUserId === targetUserId;
      }
    );

    const msg = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      fromUserId: String(sender.userId),
      fromUsername: sender.username,
      toUserId: String(toUserId),
      text,
      ts: new Date().toISOString(),
    };

    messages.push(msg);
    if (messages.length > MAX_HISTORY) messages.shift();

    // Send to sender (confirmation)
    socket.emit('privateMessage', msg);
    
    // Send to recipient if online
    if (recipientEntry) {
      const [recipientSocketId] = recipientEntry;
      console.log('Sending to recipient socket:', recipientSocketId);
      io.to(recipientSocketId).emit('privateMessage', msg);
    } else {
      console.log('Recipient not found online:', toUserId);
    }
    // Note: Message is stored even if recipient is offline
  });

  // -------- TYPING --------
  socket.on('typing', ({ toUserId, typing }) => {
    const sender = onlineUsers.get(socket.id);
    if (!sender) return;

    const recipientEntry = Array.from(onlineUsers.entries()).find(
      ([, info]) => info.userId === toUserId
    );

    if (recipientEntry) {
      io.to(recipientEntry[0]).emit('typing', {
        fromUserId: sender.userId,
        fromUsername: sender.username,
        typing: !!typing,
      });
    }
  });

  // -------- ROOMS --------
  socket.on('join-room', room => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // -------- DISCONNECT --------
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      broadcastUserList();
      socket.broadcast.emit(
        'systemMessage',
        `${user.username} left the chat`
      );
      console.log(`Disconnected: ${user.username} (${user.userId})`);
    }
  });
});

// Make io available to routes
app.set('io', io);

// =======================
// MongoDB
// =======================
(async function connectDB() {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/business-automation';

    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB error:', err.message);
  }
})();

// =======================
// Health & Root
// =======================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running successfully!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

// =======================
// Server
// =======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
