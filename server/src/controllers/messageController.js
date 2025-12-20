const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Attachment = require('../models/Attachment');
const { getIO } = require('../config/socket');
const { getUserSockets } = require('../socket/utils/userSocketMap');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.getMessages(conversationId, {
      page: parseInt(page),
      limit: parseInt(limit),
      before
    });

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo, attachmentIds } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      content,
      type,
      readBy: [{ user: req.user._id, readAt: new Date() }],
      deliveredTo: [{ user: req.user._id, deliveredAt: new Date() }]
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    if (attachmentIds && attachmentIds.length > 0) {
      messageData.attachments = attachmentIds;
      await Attachment.updateMany(
        { _id: { $in: attachmentIds } },
        { message: messageData._id }
      );
    }

    const message = await Message.create(messageData);

    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'username' } },
      { path: 'attachments' }
    ]);

    const io = getIO();
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

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// @desc    Edit message
// @route   PUT /api/messages/:id
// @access  Private
exports.editMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit message older than 15 minutes'
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username avatar');

    const io = getIO();
    const conversation = await Conversation.findById(message.conversation);
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('message-updated', { message });
      });
    });

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    const io = getIO();
    const conversation = await Conversation.findById(message.conversation);
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('message-deleted', {
          messageId: message._id,
          conversationId: message.conversation
        });
      });
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reactions
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      user: req.user._id
    });

    await message.save();
    await message.populate('reactions.user', 'username avatar');

    // Emit to participants
    const io = getIO();
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('message-reaction', {
          messageId: message._id,
          reactions: message.reactions,
          conversationId: message.conversation
        });
      });
    });

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:id/reactions
// @access  Private
exports.removeReaction = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    await message.save();
    await message.populate('reactions.user', 'username avatar');

    const io = getIO();
    const conversation = await Conversation.findById(message.conversation);
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('message-reaction', {
          messageId: message._id,
          reactions: message.reactions,
          conversationId: message.conversation
        });
      });
    });

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { q, conversationId, page = 1, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const query = {
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    };

    if (conversationId) {
      // Verify user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': req.user._id
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      query.conversation = conversationId;
    } else {
      // Get all user's conversations
      const conversations = await Conversation.find({
        'participants.user': req.user._id
      }).select('_id');

      query.conversation = { $in: conversations.map(c => c._id) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('conversation', 'type groupInfo participants');

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();

      // Emit read receipt
      const io = getIO();
      const senderSockets = getUserSockets(message.sender.toString());
      senderSockets.forEach(socketId => {
        io.to(socketId).emit('message-read', {
          messageId: message._id,
          readBy: req.user._id,
          conversationId: message.conversation
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read'
    });
  }
};