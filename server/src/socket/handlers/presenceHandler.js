const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const { getUserSockets } = require('../utils/userSocketMap');

module.exports = (io, socket) => {
  // Get online users for current user's conversations
  socket.on('get-online-users', async () => {
    try {
      // Get all conversations for this user
      const conversations = await Conversation.find({
        'participants.user': socket.userId
      }).populate('participants.user', '_id');

      // Get unique user IDs
      const userIds = new Set();
      conversations.forEach(conv => {
        conv.participants.forEach(p => {
          if (p.user._id.toString() !== socket.userId) {
            userIds.add(p.user._id.toString());
          }
        });
      });

      // Get online status for these users
      const users = await User.find({
        _id: { $in: Array.from(userIds) }
      }).select('_id status lastSeen');

      const onlineUsers = users.map(u => ({
        userId: u._id,
        status: u.status,
        lastSeen: u.lastSeen
      }));

      socket.emit('online-users', onlineUsers);

    } catch (error) {
      console.error('Get online users error:', error);
    }
  });

  // Handle explicit presence update
  socket.on('update-presence', async (data) => {
    try {
      const { status } = data;
      const validStatuses = ['online', 'away', 'busy', 'offline'];
      
      if (!validStatuses.includes(status)) return;

      await User.findByIdAndUpdate(socket.userId, {
        status,
        lastSeen: new Date()
      });

      // Broadcast to all connected users
      socket.broadcast.emit('user-status', {
        userId: socket.userId,
        status,
        lastSeen: new Date()
      });

    } catch (error) {
      console.error('Update presence error:', error);
    }
  });

  // Handle user activity (to reset away status)
  socket.on('user-active', async () => {
    try {
      const user = await User.findById(socket.userId);
      
      if (user.status === 'away') {
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        socket.broadcast.emit('user-status', {
          userId: socket.userId,
          status: 'online'
        });
      }

    } catch (error) {
      console.error('User active error:', error);
    }
  });
};