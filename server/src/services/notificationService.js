const { getIO } = require('../config/socket');
const { getUserSockets } = require('../socket/utils/userSocketMap');

class NotificationService {
  sendToUser(userId, event, data) {
    const io = getIO();
    const sockets = getUserSockets(userId.toString());
    
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }

  sendToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }

  sendToConversation(conversation, event, data, excludeUserId = null) {
    conversation.participants.forEach(participant => {
      const userId = participant.user.toString();
      if (userId !== excludeUserId?.toString()) {
        this.sendToUser(userId, event, data);
      }
    });
  }

  notifyNewMessage(conversation, message) {
    this.sendToConversation(
      conversation,
      'new-message',
      { message, conversationId: conversation._id },
      message.sender.toString()
    );
  }

  notifyTyping(conversation, userId, isTyping) {
    this.sendToConversation(
      conversation,
      'user-typing',
      { userId, conversationId: conversation._id, isTyping },
      userId
    );
  }

  notifyUserStatus(userId, status, userIds) {
    this.sendToUsers(userIds, 'user-status', { userId, status });
  }

  notifyReadReceipt(senderId, messageId, readBy, conversationId) {
    this.sendToUser(senderId, 'message-read', {
      messageId,
      readBy,
      conversationId
    });
  }
}

module.exports = new NotificationService();