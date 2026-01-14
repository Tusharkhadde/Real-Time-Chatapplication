const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Attachment = require('../models/Attachment');
const { getIO } = require('../config/socket');
const { getUserSockets } = require('../socket/utils/userSocketMap');

// @desc Get messages for a conversation
// @route GET /api/messages/:conversationId
// @access Private
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

// @desc Send message
// @route POST /api/messages
// @access Private
exports.sendMessage = async (req, res) => {
  try {
    const { 
      conversationId, 
      content, 
      type = 'text', 
      replyTo, 
      attachmentIds,
      attachments,
      poll,
      forwardedFrom
    } = req.body;

    // Determine message type; if poll payload supplied, treat as poll
    let msgType = type || 'text';
    if (poll) msgType = 'poll';
    // Debug logging
    console.log('=== SEND MESSAGE REQUEST ===');
    console.log('Type:', type);
    console.log('Content:', content);
    console.log('Poll:', poll);
    console.log('ConversationId:', conversationId);
    console.log('============================');

    // Validate conversation
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

    // Initialize message data FIRST
    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      type: msgType,
      readBy: [{ user: req.user._id, readAt: new Date() }],
      deliveredTo: [{ user: req.user._id, deliveredAt: new Date() }]
    };

    // Handle poll type
    if (type === 'poll') {
      if (!poll || !poll.question || !poll.options || poll.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Poll must have a question and at least 2 options'
        });
      }

      messageData.content = poll.question;
      messageData.poll = {
        question: poll.question,
        options: poll.options.map((opt, idx) => ({
          id: opt.id || idx + 1,
          text: opt.text,
          votes: []
        })),
        allowMultiple: poll.allowMultiple || false,
        isAnonymous: poll.isAnonymous || false,
        expiresAt: poll.expiresAt || null
      };

      console.log('Poll data created:', JSON.stringify(messageData.poll, null, 2));
    } else {
      // For non-poll messages, content is required
      if (!content && (!attachmentIds || attachmentIds.length === 0) && (!attachments || attachments.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }
      messageData.content = content || '';
    }

    // Handle reply
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Handle attachments (support both attachmentIds and attachments)
    const attIds = attachmentIds || attachments;
    if (attIds && attIds.length > 0) {
      messageData.attachments = attIds;
    }

    // Handle forwarded message
    if (forwardedFrom) {
      messageData.forwarded = true;
      messageData.forwardedFrom = {
        messageId: forwardedFrom.messageId,
        senderName: forwardedFrom.senderName,
        originalDate: forwardedFrom.originalDate
      };
    }

    console.log('Final messageData:', JSON.stringify(messageData, null, 2));

    // Create the message
    const message = await Message.create(messageData);

    // Update attachment references after message is created
    if (attIds && attIds.length > 0) {
      await Attachment.updateMany(
        { _id: { $in: attIds } },
        { message: message._id }
      );
    }

    // Populate message data
    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'username' } },
      { path: 'attachments' }
    ]);

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });

    // Emit to all participants
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
    console.error('=== SEND MESSAGE ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    console.error('==========================');

    // If validation error, return 400 with details
    if (error.name === 'ValidationError' || (error.errors && Object.keys(error.errors).length)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors || error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc Forward message
// @route POST /api/messages/forward
// @access Private
exports.forwardMessage = async (req, res) => {
  try {
    const { messageId, conversationId } = req.body;

    const originalMessage = await Message.findById(messageId)
      .populate('sender', 'username avatar')
      .populate('attachments');

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    const targetConversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id
    });

    if (!targetConversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to target conversation'
      });
    }

    const forwardedMessageData = {
      conversation: conversationId,
      sender: req.user._id,
      content: originalMessage.content,
      type: originalMessage.type,
      forwarded: true,
      forwardedFrom: {
        messageId: originalMessage._id,
        senderName: originalMessage.sender?.username,
        originalDate: originalMessage.createdAt
      },
      readBy: [{ user: req.user._id, readAt: new Date() }],
      deliveredTo: [{ user: req.user._id, deliveredAt: new Date() }]
    };

    if (originalMessage.attachments?.length > 0) {
      forwardedMessageData.attachments = originalMessage.attachments.map(a => a._id);
    }

    if (originalMessage.type === 'poll' && originalMessage.poll) {
      forwardedMessageData.poll = {
        question: originalMessage.poll.question,
        options: originalMessage.poll.options.map((opt, idx) => ({
          id: opt.id || idx + 1,
          text: opt.text,
          votes: []
        })),
        allowMultiple: originalMessage.poll.allowMultiple,
        isAnonymous: originalMessage.poll.isAnonymous
      };
    }

    const forwardedMessage = await Message.create(forwardedMessageData);

    await forwardedMessage.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'attachments' }
    ]);

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: forwardedMessage._id,
      lastActivity: new Date()
    });

    const io = getIO();
    targetConversation.participants.forEach(participant => {
      const userId = participant.user.toString();
      const sockets = getUserSockets(userId);
      sockets.forEach(socketId => {
        io.to(socketId).emit('new-message', {
          message: forwardedMessage,
          conversationId
        });
      });
    });

    res.status(201).json({
      success: true,
      data: forwardedMessage
    });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forward message'
    });
  }
};

// @desc Vote on poll
// @route POST /api/messages/:id/poll/vote
// @access Private
exports.votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const userId = req.user._id.toString();

    if (optionId === undefined || optionId === null) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message || message.type !== 'poll') {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found' 
      });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to vote on this poll'
      });
    }

    if (message.poll.expiresAt && new Date(message.poll.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Poll has expired'
      });
    }

    const poll = message.poll;

    // Remove previous vote if single-choice
    if (!poll.allowMultiple) {
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(id => id.toString() !== userId);
      });
    }

    const option = poll.options.find(o => o.id === optionId);
    
    if (!option) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option'
      });
    }

    const alreadyVoted = option.votes.some(id => id.toString() === userId);
    if (!alreadyVoted) {
      option.votes.push(req.user._id);
    }

    await message.save();

    const io = getIO();
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('poll-vote', { 
          messageId: message._id, 
          poll: message.poll,
          conversationId: message.conversation
        });
      });
    });

    res.status(200).json({ 
      success: true, 
      data: message.poll 
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote on poll'
    });
  }
};

// @desc Remove vote from poll
// @route DELETE /api/messages/:id/poll/vote
// @access Private
exports.removeVote = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const message = await Message.findById(req.params.id);

    if (!message || message.type !== 'poll') {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

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

    message.poll.options.forEach(option => {
      option.votes = option.votes.filter(id => id.toString() !== userId);
    });

    await message.save();

    const io = getIO();
    conversation.participants.forEach(participant => {
      const sockets = getUserSockets(participant.user.toString());
      sockets.forEach(socketId => {
        io.to(socketId).emit('poll-vote', {
          messageId: message._id,
          poll: message.poll,
          conversationId: message.conversation
        });
      });
    });

    res.status(200).json({
      success: true,
      data: message.poll
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove vote'
    });
  }
};

// @desc Edit message
// @route PUT /api/messages/:id
// @access Private
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

// @desc Delete message
// @route DELETE /api/messages/:id
// @access Private
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

// @desc Add reaction to message
// @route POST /api/messages/:id/reactions
// @access Private
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

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    message.reactions.push({
      emoji,
      user: req.user._id
    });

    await message.save();
    await message.populate('reactions.user', 'username avatar');

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

// @desc Remove reaction from message
// @route DELETE /api/messages/:id/reactions
// @access Private
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

// @desc Search messages
// @route GET /api/messages/search
// @access Private
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

// @desc Mark message as read
// @route PUT /api/messages/:id/read
// @access Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();

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