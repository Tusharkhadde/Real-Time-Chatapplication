const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class MessageService {
  async createMessage(data) {
    const message = await Message.create(data);
    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'replyTo', select: 'content sender' },
      { path: 'attachments' }
    ]);
    return message;
  }

  async getConversationMessages(conversationId, options = {}) {
    return Message.getMessages(conversationId, options);
  }

  async markMessagesAsRead(conversationId, userId) {
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    // Update conversation's lastRead
    await Conversation.updateOne(
      {
        _id: conversationId,
        'participants.user': userId
      },
      {
        $set: { 'participants.$.lastRead': new Date() }
      }
    );
  }

  async markMessagesAsDelivered(conversationId, userId) {
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'deliveredTo.user': { $ne: userId }
      },
      {
        $push: {
          deliveredTo: {
            user: userId,
            deliveredAt: new Date()
          }
        }
      }
    );
  }

  async getUnreadCount(userId) {
    const conversations = await Conversation.find({
      'participants.user': userId
    });

    let totalUnread = 0;

    for (const conv of conversations) {
      totalUnread += await conv.getUnreadCount(userId);
    }

    return totalUnread;
  }
}

module.exports = new MessageService();