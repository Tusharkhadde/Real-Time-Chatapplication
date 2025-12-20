const connectionHandler = require('./handlers/connectionHandler');
const messageHandler = require('./handlers/messageHandler');
const typingHandler = require('./handlers/typingHandler');
const presenceHandler = require('./handlers/presenceHandler');
const readReceiptHandler = require('./handlers/readReceiptHandler');
const { addUserSocket, removeUserSocket } = require('./utils/userSocketMap');
const { joinUserRooms } = require('./utils/roomManager');

module.exports = (io) => {
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Add socket to user map
    addUserSocket(socket.userId, socket.id);

    // Join user's conversation rooms
    await joinUserRooms(socket);

    // Handle connection events
    connectionHandler(io, socket);

    // Handle messages
    messageHandler(io, socket);

    // Handle typing indicators
    typingHandler(io, socket);

    // Handle presence (online/offline)
    presenceHandler(io, socket);

    // Handle read receipts
    readReceiptHandler(io, socket);

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.user.username} (${reason})`);
      removeUserSocket(socket.userId, socket.id);

      // Update user status if no more connections
      const { getUserSockets } = require('./utils/userSocketMap');
      const remainingSockets = getUserSockets(socket.userId);
      
      if (remainingSockets.length === 0) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(socket.userId, {
          status: 'offline',
          lastSeen: new Date()
        });

        // Notify others about offline status
        socket.broadcast.emit('user-status', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });
  });
};