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

// Poll option schema
const pollOptionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 200
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: false });

// Poll schema
const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    maxlength: 500
  },
  options: {
    type: [pollOptionSchema],
    validate: {
      validator: function(options) {
        return options && options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  allowMultiple: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
    // Content is optional for poll messages
    required: function() {
      return this.type !== 'poll' && this.type !== 'system' && 
             (!this.attachments || this.attachments.length === 0);
    }
  },

  type: {
    type: String,
    default: 'text'
  },

  // Poll data (only for type: 'poll')
  poll: pollSchema,

  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment'
  }],

  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  reactions: [reactionSchema],

  // Forwarded message info (MOVED OUT of readBy)
  forwarded: {
    type: Boolean,
    default: false
  },

  forwardedFrom: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    senderName: String,
    originalDate: Date
  },

  // Read receipts
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

  // Delivery receipts
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
messageSchema.index({ type: 1 });

// Virtual display time
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual to get total votes for poll
messageSchema.virtual('poll.totalVotes').get(function() {
  if (!this.poll || !this.poll.options) return 0;
  return this.poll.options.reduce((total, opt) => total + (opt.votes?.length || 0), 0);
});

// Pre-save middleware
messageSchema.pre('save', async function(next) {
  // Update conversation stats when new message created
  if (this.isNew) {
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

// Pre-validate middleware for polls
messageSchema.pre('validate', function(next) {
  if (this.type === 'poll') {
    if (!this.poll || !this.poll.question) {
      return next(new Error('Poll question is required for poll messages'));
    }
    if (!this.poll.options || this.poll.options.length < 2) {
      return next(new Error('Poll must have at least 2 options'));
    }
    // Set content to question if not provided
    if (!this.content) {
      this.content = this.poll.question;
    }
  }
  next();
});

// Paginated message fetch
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
    .populate('replyTo', 'content sender type')
    .populate('attachments')
    .populate('reactions.user', 'username avatar')
    .populate('poll.options.votes', 'username avatar') // Populate poll voters
    .lean();

  return messages.reverse();
};

// Static method to vote on poll
messageSchema.statics.votePoll = async function(messageId, optionId, userId) {
  const message = await this.findById(messageId);
  
  if (!message || message.type !== 'poll') {
    throw new Error('Poll not found');
  }

  if (message.poll.expiresAt && new Date(message.poll.expiresAt) < new Date()) {
    throw new Error('Poll has expired');
  }

  const poll = message.poll;

  // Remove previous votes if single choice
  if (!poll.allowMultiple) {
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(id => id.toString() !== userId.toString());
    });
  }

  // Find option and add vote
  const option = poll.options.find(o => o.id === optionId);
  if (!option) {
    throw new Error('Invalid option');
  }

  const alreadyVoted = option.votes.some(id => id.toString() === userId.toString());
  if (!alreadyVoted) {
    option.votes.push(userId);
  }

  await message.save();
  return message.poll;
};

// Static method to remove vote
messageSchema.statics.removeVote = async function(messageId, userId) {
  const message = await this.findById(messageId);
  
  if (!message || message.type !== 'poll') {
    throw new Error('Poll not found');
  }

  message.poll.options.forEach(option => {
    option.votes = option.votes.filter(id => id.toString() !== userId.toString());
  });

  await message.save();
  return message.poll;
};

// Instance method to check if user has voted
messageSchema.methods.hasUserVoted = function(userId) {
  if (!this.poll || !this.poll.options) return false;
  
  return this.poll.options.some(opt => 
    opt.votes.some(id => id.toString() === userId.toString())
  );
};

// Instance method to get user's vote
messageSchema.methods.getUserVotes = function(userId) {
  if (!this.poll || !this.poll.options) return [];
  
  return this.poll.options
    .filter(opt => opt.votes.some(id => id.toString() === userId.toString()))
    .map(opt => opt.id);
};

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);