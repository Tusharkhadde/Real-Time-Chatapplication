const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

class SearchService {
  async searchMessages(userId, query, options = {}) {
    const { conversationId, page = 1, limit = 20 } = options;

    const searchQuery = {
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (conversationId) {
      searchQuery.conversation = conversationId;
    } else {
      const conversations = await Conversation.find({
        'participants.user': userId
      }).select('_id');
      searchQuery.conversation = { $in: conversations.map(c => c._id) };
    }

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('conversation', 'type groupInfo');

    const total = await Message.countDocuments(searchQuery);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async searchUsers(query, excludeUserId, limit = 10) {
    return User.find({
      _id: { $ne: excludeUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email avatar status')
    .limit(limit);
  }

  async searchConversations(userId, query) {
    // Search in group names
    const groupConversations = await Conversation.find({
      type: 'group',
      'participants.user': userId,
      'groupInfo.name': { $regex: query, $options: 'i' }
    }).populate('participants.user', 'username avatar');

    // Search by participant username in private chats
    const privateConversations = await Conversation.find({
      type: 'private',
      'participants.user': userId
    }).populate('participants.user', 'username avatar');

    const matchingPrivate = privateConversations.filter(conv => {
      const otherParticipant = conv.participants.find(
        p => p.user._id.toString() !== userId.toString()
      );
      return otherParticipant?.user.username.toLowerCase().includes(query.toLowerCase());
    });

    return [...groupConversations, ...matchingPrivate];
  }
}

module.exports = new SearchService();