const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const { getUserSockets } = require('../utils/userSocketMap');

module.exports = (io, socket) => {
  // Update user status to online
  const setOnline = async () => {
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date()
    });

    // Notify all users about online status
    socket.broadcast.emit('user-status', {
      userId: socket.userId,
      status: 'online'
    });
  };

  setOnline();

  // Handle explicit status change
  socket.on('set-status', async (status) => {
    const validStatuses = ['online', 'away', 'busy'];
    if (!validStatuses.includes(status)) return;

    await User.findByIdAndUpdate(socket.userId, { status });

    socket.broadcast.emit('user-status', {
      userId: socket.userId,
      status
    });
  });

  // Join a specific conversation room
  socket.on('join-conversation', async (conversationId) => {
    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': socket.userId
    });

    if (conversation) {
      socket.join(`conversation:${conversationId}`);
      socket.emit('joined-conversation', { conversationId });
    }
  });

  // Leave a conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });
};