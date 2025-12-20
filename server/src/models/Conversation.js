const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastRead: {
      type: Date,
      default: Date.now
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }],
  groupInfo: {
    name: {
      type: String,
      maxlength: [50, 'Group name cannot exceed 50 characters']
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    avatar: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    totalMessages: { type: Number, default: 0 },
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }]
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ type: 1, 'participants.user': 1 });

// Get unread count for a user
conversationSchema.methods.getUnreadCount = async function(userId) {
  const Message = mongoose.model('Message');
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!participant) return 0;
  
  return await Message.countDocuments({
    conversation: this._id,
    sender: { $ne: userId },
    createdAt: { $gt: participant.lastRead }
  });
};

// Static method to find or create private conversation
conversationSchema.statics.findOrCreatePrivate = async function(user1Id, user2Id) {
  let conversation = await this.findOne({
    type: 'private',
    'participants.user': { $all: [user1Id, user2Id] },
    $expr: { $eq: [{ $size: '$participants' }, 2] }
  }).populate('participants.user', 'username avatar status lastSeen')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      type: 'private',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ]
    });
    
    await conversation.populate('participants.user', 'username avatar status lastSeen');
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);