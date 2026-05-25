// ============================================
// server.js — Real-Time Chat Backend
// Codtech IT Solutions Internship — Task 2
// Intern: Karthika Shanmuga Pandian | CTIS9056
// Uses: Node.js + Express + Socket.IO
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
const io = new Server(server, {
  cors: { origin: '*' } // Allow all origins for development
});

// Serve the frontend (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// IN-MEMORY STORAGE
// ============================================
const rooms = {
  general:   { name: '💬 General',   users: new Map(), messages: [] },
  tech:      { name: '💻 Tech Talk',  users: new Map(), messages: [] },
  random:    { name: '🎲 Random',     users: new Map(), messages: [] },
  codtech:   { name: '🏢 Codtech',    users: new Map(), messages: [] },
};

// Track all connected users: socketId → { username, room, color }
const connectedUsers = new Map();

// Color palette for user avatars
const USER_COLORS = [
  '#e74c3c','#3498db','#2ecc71','#f39c12',
  '#9b59b6','#1abc9c','#e67e22','#e91e63',
  '#00bcd4','#ff5722','#607d8b','#795548'
];

let colorIndex = 0;
function getNextColor() {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

// ============================================
// HELPER — build a system message object
// ============================================
function sysMsg(text) {
  return { type: 'system', text, time: new Date().toISOString() };
}

// ============================================
// SOCKET.IO EVENTS
// ============================================
io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ------------------------------------------
  // 1. USER JOINS with username + room
  // ------------------------------------------
  socket.on('user:join', ({ username, room }) => {
    if (!username || !room || !rooms[room]) return;

    const color = getNextColor();
    const user = { username, room, color, socketId: socket.id };

    // Store user globally and in room
    connectedUsers.set(socket.id, user);
    rooms[room].users.set(socket.id, user);

    // Join the Socket.IO room
    socket.join(room);

    // Send last 50 messages to the new user
    socket.emit('chat:history', rooms[room].messages.slice(-50));

    // Notify everyone in the room
    const joinMsg = sysMsg(`${username} joined the chat`);
    rooms[room].messages.push(joinMsg);
    io.to(room).emit('chat:message', joinMsg);

    // Broadcast updated user list for this room
    io.to(room).emit('room:users', getRoomUsers(room));

    // Send room list with counts to everyone
    io.emit('rooms:update', getRoomsInfo());

    console.log(`[JOIN] ${username} → ${room}`);
  });

  // ------------------------------------------
  // 2. SEND A CHAT MESSAGE
  // ------------------------------------------
  socket.on('chat:send', ({ text }) => {
    const user = connectedUsers.get(socket.id);
    if (!user || !text || !text.trim()) return;

    const msg = {
      type: 'message',
      username: user.username,
      color: user.color,
      text: text.trim().slice(0, 500), // max 500 chars
      time: new Date().toISOString(),
    };

    // Save to room history (keep last 200)
    rooms[user.room].messages.push(msg);
    if (rooms[user.room].messages.length > 200) {
      rooms[user.room].messages.shift();
    }

    // Broadcast to everyone in the room
    io.to(user.room).emit('chat:message', msg);
  });

  // ------------------------------------------
  // 3. TYPING INDICATOR
  // ------------------------------------------
  socket.on('chat:typing', ({ isTyping }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    // Broadcast to others in the room (not self)
    socket.to(user.room).emit('chat:typing', {
      username: user.username,
      isTyping,
    });
  });

  // ------------------------------------------
  // 4. SWITCH ROOM
  // ------------------------------------------
  socket.on('room:switch', ({ newRoom }) => {
    const user = connectedUsers.get(socket.id);
    if (!user || !rooms[newRoom]) return;

    const oldRoom = user.room;

    // Leave old room
    socket.leave(oldRoom);
    rooms[oldRoom].users.delete(socket.id);
    const leaveMsg = sysMsg(`${user.username} left the room`);
    rooms[oldRoom].messages.push(leaveMsg);
    io.to(oldRoom).emit('chat:message', leaveMsg);
    io.to(oldRoom).emit('room:users', getRoomUsers(oldRoom));

    // Join new room
    user.room = newRoom;
    connectedUsers.set(socket.id, user);
    rooms[newRoom].users.set(socket.id, user);
    socket.join(newRoom);

    // Send history
    socket.emit('chat:history', rooms[newRoom].messages.slice(-50));

    const joinMsg = sysMsg(`${user.username} joined the room`);
    rooms[newRoom].messages.push(joinMsg);
    io.to(newRoom).emit('chat:message', joinMsg);
    io.to(newRoom).emit('room:users', getRoomUsers(newRoom));
    io.emit('rooms:update', getRoomsInfo());

    console.log(`[SWITCH] ${user.username}: ${oldRoom} → ${newRoom}`);
  });

  // ------------------------------------------
  // 5. DISCONNECT
  // ------------------------------------------
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      rooms[user.room].users.delete(socket.id);
      connectedUsers.delete(socket.id);

      const leaveMsg = sysMsg(`${user.username} left the chat`);
      rooms[user.room].messages.push(leaveMsg);
      io.to(user.room).emit('chat:message', leaveMsg);
      io.to(user.room).emit('room:users', getRoomUsers(user.room));
      io.emit('rooms:update', getRoomsInfo());

      console.log(`[-] ${user.username} disconnected`);
    }
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRoomUsers(room) {
  return Array.from(rooms[room].users.values()).map(u => ({
    username: u.username,
    color: u.color,
  }));
}

function getRoomsInfo() {
  return Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    count: r.users.size,
  }));
}

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✅ ChatNow server running at http://localhost:${PORT}`);
  console.log(`   Intern: Karthika Shanmuga Pandian | CTIS9056`);
  console.log(`   Press Ctrl+C to stop\n`);
});
