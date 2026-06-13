require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Configure Socket.IO connections
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Client joins a role-based room (ADMIN, MANAGER, EMPLOYEE, CUSTOMER)
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`[Socket.IO] Client ${socket.id} joined room: ${roomName}`);
  });

  // Client joins an order-specific room for tracking
  socket.on('trackOrder', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`[Socket.IO] Client ${socket.id} tracking order: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Attach socket server to express app so controllers can use it
app.set('io', io);

// Connect to MongoDB
connectDB();

// Create upload folders if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const attendanceDir = path.join(__dirname, '../uploads/attendance');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(attendanceDir)) fs.mkdirSync(attendanceDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploaded files (selfies)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/employees', employeeRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Epitome Restaurant Management API is running.' });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] Server listening on port ${PORT}`);
  console.log(`[Server] Geofence active at lat: ${process.env.RESTAURANT_LAT || 12.9715987}, lng: ${process.env.RESTAURANT_LNG || 77.5945627}`);
});
