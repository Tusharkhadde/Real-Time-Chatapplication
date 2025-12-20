const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const messageService = require('../../services/messageService');
const { getUserSockets } = require('../utils/userSocketMap');

module.exports = (io, socket) => {
  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { conversationId, content, type = 'text', replyTo, attachmentIds } = data;

      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Create message
      const messageData = {
        conversation: conversationId,
        sender: socket.userId,
        content,
        type,
        readBy: [{ user: socket.userId, readAt: new Date() }],
        deliveredTo: [{ user: socket.userId, deliveredAt: new Date() }]
      };

      if (replyTo) messageData.replyTo = replyTo;
      if (attachmentIds) messageData.attachments = attachmentIds;

      const message = await messageService.createMessage(messageData);

      // Emit to all participants
      conversation.participants.forEach(participant => {
        const userId = participant.user.toString();
        const sockets = getUserSockets(userId);
        sockets.forEach(socketId => {
          io.to(socketId).emit('new-message', {
            message,
            conversationId
          });
        });
      });

    } catch (error) {
      console.error('Send message socket error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message edit
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, content } = data;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.userId,
        isDeleted: false
      });

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if within edit window (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt < fifteenMinutesAgo) {
        return socket.emit('error', { message: 'Cannot edit old messages' });
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();
      await message.populate('sender', 'username avatar');

      // Emit to conversation room
      io.to(`conversation:${message.conversation}`).emit('message-updated', { message });

    } catch (error) {
      console.error('Edit message socket error:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.userId
      });

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = 'This message was deleted';
      await message.save();

      io.to(`conversation:${message.conversation}`).emit('message-deleted', {
        messageId,
        conversationId: message.conversation
      });

    } catch (error) {
      console.error('Delete message socket error:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle reaction
  socket.on('add-reaction', async (data) => {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== socket.userId
      );

      // Add new reaction
      message.reactions.push({ emoji, user: socket.userId });
      await message.save();
      await message.populate('reactions.user', 'username avatar');

      io.to(`conversation:${message.conversation}`).emit('message-reaction', {
        messageId,
        reactions: message.reactions,
        conversationId: message.conversation
      });

    } catch (error) {
      console.error('Add reaction socket error:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  socket.on('remove-reaction', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId);
      if (!message) return;

      message.reactions = message.reactions.filter(
        r => r.user.toString() !== socket.userId
      );
      await message.save();

      io.to(`conversation:${message.conversation}`).emit('message-reaction', {
        messageId,
        reactions: message.reactions,
        conversationId: message.conversation
      });

    } catch (error) {
      console.error('Remove reaction socket error:', error);
    }
  });
};