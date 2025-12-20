const Conversation = require('../../models/Conversation');

const joinUserRooms = async (socket) => {
  try {
    // Get all conversations for this user
    const conversations = await Conversation.find({
      'participants.user': socket.userId,
      isActive: true
    }).select('_id');

    // Join all conversation rooms
    conversations.forEach(conv => {
      socket.join(`conversation:${conv._id}`);
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    return conversations.map(c => c._id);
  } catch (error) {
    console.error('Join user rooms error:', error);
    return [];
  }
};

const leaveAllRooms = (socket) => {
  const rooms = Array.from(socket.rooms);
  rooms.forEach(room => {
    if (room !== socket.id) {
      socket.leave(room);
    }
  });
};

const joinConversationRoom = (socket, conversationId) => {
  socket.join(`conversation:${conversationId}`);
};

const leaveConversationRoom = (socket, conversationId) => {
  socket.leave(`conversation:${conversationId}`);
};

module.exports = {
  joinUserRooms,
  leaveAllRooms,
  joinConversationRoom,
  leaveConversationRoom
};