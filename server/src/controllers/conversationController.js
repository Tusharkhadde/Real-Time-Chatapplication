const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all conversations
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user._id,
      isActive: true
    })
    .populate('participants.user', 'username avatar status lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' }
    })
    .sort({ lastActivity: -1 });

    // Calculate unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const convObj = conv.toObject();
        convObj.unreadCount = await conv.getUnreadCount(req.user._id);
        return convObj;
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    })
    .populate('participants.user', 'username avatar status lastSeen statusMessage')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const convObj = conversation.toObject();
    convObj.unreadCount = await conversation.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      data: convObj
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// @desc    Create or get private conversation
// @route   POST /api/conversations/private
// @access  Private
exports.createPrivateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if blocked
    if (req.user.blockedUsers?.includes(userId) || 
        otherUser.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create conversation with this user'
      });
    }

    const conversation = await Conversation.findOrCreatePrivate(
      req.user._id,
      userId
    );

    await conversation.populate('lastMessage');

    const convObj = conversation.toObject();
    convObj.unreadCount = await conversation.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      data: convObj
    });
  } catch (error) {
    console.error('Create private conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// @desc    Create group conversation
// @route   POST /api/conversations/group
// @access  Private
exports.createGroupConversation = async (req, res) => {
  try {
    const { name, description, participants } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!participants || participants.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required'
      });
    }

    // Add current user as admin
    const participantsWithRoles = [
      { user: req.user._id, role: 'admin' },
      ...participants.map(id => ({ user: id, role: 'member' }))
    ];

    const conversation = await Conversation.create({
      type: 'group',
      participants: participantsWithRoles,
      groupInfo: {
        name,
        description,
        createdBy: req.user._id
      }
    });

    await conversation.populate('participants.user', 'username avatar status lastSeen');

    // Create system message
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} created the group "${name}"`,
      type: 'system'
    });

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
};

// @desc    Update group
// @route   PUT /api/conversations/:id/group
// @access  Private (Admin only)
exports.updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update group settings'
      });
    }

    if (name) conversation.groupInfo.name = name;
    if (description !== undefined) conversation.groupInfo.description = description;

    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group'
    });
  }
};

// @desc    Add participant to group
// @route   POST /api/conversations/:id/participants
// @access  Private (Admin only)
exports.addParticipant = async (req, res) => {
  try {
    const { userId } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add participants'
      });
    }

    // Check if user is already a participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId
    );

    if (isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant'
      });
    }

    // Add participant
    conversation.participants.push({ user: userId, role: 'member' });
    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    // Create system message
    const newUser = await User.findById(userId);
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} added ${newUser.username} to the group`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant'
    });
  }
};

// @desc    Remove participant from group
// @route   DELETE /api/conversations/:id/participants/:userId
// @access  Private (Admin only)
exports.removeParticipant = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove participants'
      });
    }

    // Cannot remove yourself if you're the only admin
    const admins = conversation.participants.filter(p => p.role === 'admin');
    if (userId === req.user._id.toString() && admins.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave group as the only admin. Assign another admin first.'
      });
    }

    const removedUser = await User.findById(userId);
    
    conversation.participants = conversation.participants.filter(
      p => p.user.toString() !== userId
    );
    
    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    // Create system message
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${removedUser.username} was removed from the group`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant'
    });
  }
};

// @desc    Leave group
// @route   POST /api/conversations/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    // If user is the only admin, assign another participant as admin
    if (participant.role === 'admin') {
      const admins = conversation.participants.filter(p => p.role === 'admin');
      if (admins.length === 1 && conversation.participants.length > 1) {
        const newAdmin = conversation.participants.find(
          p => p.user.toString() !== req.user._id.toString()
        );
        newAdmin.role = 'admin';
      }
    }

    conversation.participants = conversation.participants.filter(
      p => p.user.toString() !== req.user._id.toString()
    );

    // If no participants left, deactivate the group
    if (conversation.participants.length === 0) {
      conversation.isActive = false;
    }

    await conversation.save();

    // Create system message
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} left the group`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Update lastRead for the user
    const participantIndex = conversation.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex !== -1) {
      conversation.participants[participantIndex].lastRead = new Date();
      await conversation.save();
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

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

// @desc    Delete conversation (soft delete)
// @route   DELETE /api/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // For private chats, just remove the user
    // For groups, admin can delete for everyone
    if (conversation.type === 'private') {
      conversation.participants = conversation.participants.filter(
        p => p.user.toString() !== req.user._id.toString()
      );
      
      if (conversation.participants.length === 0) {
        conversation.isActive = false;
      }
    } else {
      const participant = conversation.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );

      if (participant?.role === 'admin') {
        conversation.isActive = false;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete group conversations'
        });
      }
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
};