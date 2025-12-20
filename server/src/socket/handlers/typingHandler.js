const Conversation = require('../../models/Conversation');
const { getUserSockets } = require('../utils/userSocketMap');

// Store typing states
const typingUsers = new Map();

module.exports = (io, socket) => {
  socket.on('typing-start', async (data) => {
    try {
      const { conversationId } = data;

      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId
      });

      if (!conversation) return;

      // Store typing state
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(socket.userId);

      // Notify other participants
      conversation.participants.forEach(participant => {
        const userId = participant.user.toString();
        if (userId !== socket.userId) {
          const sockets = getUserSockets(userId);
          sockets.forEach(socketId => {
            io.to(socketId).emit('user-typing', {
              conversationId,
              userId: socket.userId,
              username: socket.user.username,
              isTyping: true
            });
          });
        }
      });

      // Auto-clear typing after 3 seconds
      setTimeout(() => {
        const convTyping = typingUsers.get(conversationId);
        if (convTyping) {
          convTyping.delete(socket.userId);
        }
      }, 3000);

    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on('typing-stop', async (data) => {
    try {
      const { conversationId } = data;

      // Clear typing state
      const convTyping = typingUsers.get(conversationId);
      if (convTyping) {
        convTyping.delete(socket.userId);
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId
      });

      if (!conversation) return;

      // Notify other participants
      conversation.participants.forEach(participant => {
        const userId = participant.user.toString();
        if (userId !== socket.userId) {
          const sockets = getUserSockets(userId);
          sockets.forEach(socketId => {
            io.to(socketId).emit('user-typing', {
              conversationId,
              userId: socket.userId,
              username: socket.user.username,
              isTyping: false
            });
          });
        }
      });

    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });
};