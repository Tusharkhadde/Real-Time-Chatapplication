const User = require('../models/User');
const Conversation = require('../models/Conversation');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let query = { _id: { $ne: req.user._id } };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username email avatar status statusMessage lastSeen')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ username: 1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar status statusMessage lastSeen createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['username', 'statusMessage', 'settings'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Check if username is taken
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Update avatar
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Process image with sharp
    const filename = `avatar-${req.user._id}-${Date.now()}.webp`;
    const outputPath = path.join(__dirname, '../../uploads/avatars', filename);

    await sharp(req.file.path)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Delete original uploaded file
    fs.unlinkSync(req.file.path);

    // Delete old avatar if exists
    if (req.user.avatar) {
      const oldPath = path.join(__dirname, '../..', req.user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: { avatar: avatarUrl },
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar'
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status, statusMessage } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (statusMessage !== undefined) updates.statusMessage = statusMessage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// @desc    Block user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);

    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: req.params.id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
};

// @desc    Unblock user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user'
    });
  }
};

// @desc    Get blocked users
// @route   GET /api/users/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username avatar');

    res.status(200).json({
      success: true,
      data: user.blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked users'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { _id: { $nin: req.user.blockedUsers || [] } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar status lastSeen')
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      status: 'online'
    }).select('username avatar status');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online users'
    });
  }
};