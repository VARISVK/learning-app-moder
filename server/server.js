const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
// Use mock database for local development, PostgreSQL for production
const Database = process.env.DATABASE_URL 
  ? require('../src/database/postgres-database')
  : require('../src/database/mock-database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            console.error('Invalid JSON received:', buf.toString());
            res.status(400).json({ success: false, error: 'Invalid JSON format' });
            throw new Error('Invalid JSON');
        }
    }
}));

// Serve static files from src directory
app.use(express.static(path.join(__dirname, '../src')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Store online users
const onlineUsers = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user login
    socket.on('user-login', (userData) => {
        onlineUsers.set(socket.id, {
            ...userData,
            socketId: socket.id,
            lastSeen: new Date()
        });
        
        // Notify all clients about the new online user
        socket.broadcast.emit('user-online', userData);
        
        // Send current online users to the new user
        socket.emit('online-users', Array.from(onlineUsers.values()));
    });

    // Handle user logout
    socket.on('user-logout', (userId) => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            onlineUsers.delete(socket.id);
            socket.broadcast.emit('user-offline', user);
        }
    });

    // Handle connection request
    socket.on('connection-request', (data) => {
        const { targetUserId, requesterId, requesterName } = data;
        
        // Find target user's socket
        const targetUser = Array.from(onlineUsers.values())
            .find(user => user.id === targetUserId);
        
        if (targetUser) {
            io.to(targetUser.socketId).emit('connection-request', {
                requesterId,
                requesterName,
                socketId: socket.id
            });
        }
    });

    // Handle connection response
    socket.on('connection-response', (data) => {
        const { requesterSocketId, accepted, targetUserId, targetUserName } = data;
        
        if (accepted) {
            // Notify both users to start WebRTC session
            io.to(requesterSocketId).emit('connection-accepted', {
                targetUserId,
                targetUserName
            });
            socket.emit('connection-accepted', {
                targetUserId: data.requesterId,
                targetUserName: data.requesterName
            });
        } else {
            io.to(requesterSocketId).emit('connection-rejected', {
                targetUserId,
                targetUserName
            });
        }
    });

    // Handle WebRTC signaling
    socket.on('webrtc-offer', (data) => {
        const { targetUserId, offer } = data;
        const targetUser = Array.from(onlineUsers.values())
            .find(user => user.id === targetUserId);
        
        if (targetUser) {
            io.to(targetUser.socketId).emit('webrtc-offer', {
                fromUserId: data.fromUserId,
                offer
            });
        }
    });

    socket.on('webrtc-answer', (data) => {
        const { targetUserId, answer } = data;
        const targetUser = Array.from(onlineUsers.values())
            .find(user => user.id === targetUserId);
        
        if (targetUser) {
            io.to(targetUser.socketId).emit('webrtc-answer', {
                fromUserId: data.fromUserId,
                answer
            });
        }
    });

    socket.on('webrtc-ice-candidate', (data) => {
        const { targetUserId, candidate } = data;
        const targetUser = Array.from(onlineUsers.values())
            .find(user => user.id === targetUserId);
        
        if (targetUser) {
            io.to(targetUser.socketId).emit('webrtc-ice-candidate', {
                fromUserId: data.fromUserId,
                candidate
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            onlineUsers.delete(socket.id);
            socket.broadcast.emit('user-offline', user);
        }
        console.log('User disconnected:', socket.id);
    });
});

// API endpoints
app.get('/api/online-users', (req, res) => {
    res.json(Array.from(onlineUsers.values()));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        onlineUsers: onlineUsers.size,
        database: process.env.DATABASE_URL ? 'configured' : 'mock',
        timestamp: new Date().toISOString()
    });
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const result = await Database.registerUser(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const result = await Database.loginUser(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get user profile
app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await Database.getUserProfile(req.params.id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Update wallet
app.post('/api/wallet/update', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const result = await Database.updateWallet(userId, amount);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get wallet transactions
app.get('/api/wallet/transactions/:userId', async (req, res) => {
    try {
        const result = await Database.getWalletTransactions(req.params.userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get online users from database
app.get('/api/database/online-users/:currentUserId', async (req, res) => {
    try {
        const result = await Database.getOnlineUsers(req.params.currentUserId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Set user offline
app.post('/api/user/offline', async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await Database.setUserOffline(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured - using mock database'}`);
});

// Handle server errors gracefully
server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});


