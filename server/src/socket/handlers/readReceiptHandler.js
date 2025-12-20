const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const messageService = require('../../services/messageService');
const { getUserSockets } = require('../utils/userSocketMap');

module.exports = (io, socket) => {
  // Mark messages as read
  socket.on('mark-read', async (data) => {
    try {
      const { conversationId, messageIds } = data;

      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId
      });

      if (!conversation) return;

      // Update messages
      if (messageIds && messageIds.length > 0) {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            sender: { $ne: socket.userId },
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date()
              }
            }
          }
        );
      }

      // Update conversation lastRead
      await Conversation.updateOne(
        {
          _id: conversationId,
          'participants.user': socket.userId
        },
        {
          $set: { 'participants.$.lastRead': new Date() }
        }
      );

      // Notify message senders
      if (messageIds && messageIds.length > 0) {
        const messages = await Message.find({ _id: { $in: messageIds } });
        const senderIds = [...new Set(messages.map(m => m.sender.toString()))];

        senderIds.forEach(senderId => {
          if (senderId !== socket.userId) {
            const sockets = getUserSockets(senderId);
            sockets.forEach(socketId => {
              io.to(socketId).emit('messages-read', {
                conversationId,
                messageIds,
                readBy: socket.userId,
                readAt: new Date()
              });
            });
          }
        });
      }

    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Mark all messages in conversation as read
  socket.on('mark-conversation-read', async (data) => {
    try {
      const { conversationId } = data;

      await messageService.markMessagesAsRead(conversationId, socket.userId);

      // Notify other participants
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      conversation.participants.forEach(participant => {
        const userId = participant.user.toString();
        if (userId !== socket.userId) {
          const sockets = getUserSockets(userId);
          sockets.forEach(socketId => {
            io.to(socketId).emit('conversation-read', {
              conversationId,
              readBy: socket.userId,
              readAt: new Date()
            });
          });
        }
      });

    } catch (error) {
      console.error('Mark conversation read error:', error);
    }
  });

  // Mark messages as delivered
  socket.on('mark-delivered', async (data) => {
    try {
      const { conversationId } = data;

      await messageService.markMessagesAsDelivered(conversationId, socket.userId);

    } catch (error) {
      console.error('Mark delivered error:', error);
    }
  });
};