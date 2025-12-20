const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
    default: 'text'
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [reactionSchema],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  metadata: {
    linkPreview: {
      url: String,
      title: String,
      description: String,
      image: String
    }
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Update conversation's last message and activity
    await mongoose.model('Conversation').findByIdAndUpdate(
      this.conversation,
      {
        lastMessage: this._id,
        lastActivity: new Date(),
        $inc: { 'metadata.totalMessages': 1 }
      }
    );
  }
  next();
});

// Static method to get messages with pagination
messageSchema.statics.getMessages = async function(conversationId, options = {}) {
  const { page = 1, limit = 50, before } = options;
  
  const query = { 
    conversation: conversationId,
    isDeleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('replyTo', 'content sender')
    .populate('attachments')
    .populate('reactions.user', 'username avatar')
    .lean();
  
  return messages.reverse();
};

module.exports = mongoose.model('Message', messageSchema);