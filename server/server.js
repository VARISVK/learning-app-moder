const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

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
app.use(express.json());

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
    res.json({ status: 'OK', onlineUsers: onlineUsers.size });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});


