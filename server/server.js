require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_app';

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
[uploadsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ==================== MONGOOSE MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true, 
    trim: true, 
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'], 
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  avatar: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'away', 'busy'], 
    default: 'offline' 
  },
  statusMessage: { type: String, default: '', maxlength: 100 },
  lastSeen: { type: Date, default: Date.now },
  settings: {
    notifications: { 
      sound: { type: Boolean, default: true }, 
      desktop: { type: Boolean, default: true } 
    },
    privacy: { 
      showLastSeen: { type: Boolean, default: true }, 
      showStatus: { type: Boolean, default: true } 
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign({ id: this._id }, JWT_SECRET, { expiresIn: '7d' });
};

// Remove password from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Handle duplicate key error
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    next(new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`));
  } else {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['private', 'group'], default: 'private' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    lastRead: { type: Date, default: Date.now },
    notifications: { type: Boolean, default: true }
  }],
  groupInfo: {
    name: { type: String, maxlength: 50 },
    description: { type: String, maxlength: 200 },
    avatar: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  conversation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true, 
    index: true 
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 5000 },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'], 
    default: 'text' 
  },
  attachments: [{ 
    filename: String, 
    originalName: String, 
    mimeType: String, 
    size: Number, 
    url: String 
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    emoji: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

// ==================== MULTER SETUP ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp3|mp4|wav/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

// ==================== AUTH MIDDLEWARE ====================
const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer') 
      ? req.headers.authorization.split(' ')[1] 
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// ==================== SOCKET USER MAP ====================
const userSockets = new Map();

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) userSockets.delete(userId);
  }
};

const getUserSockets = (userId) => {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
};

const isUserOnline = (userId) => userSockets.has(userId) && userSockets.get(userId).size > 0;

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Register request:', { ...req.body, password: '***' });
    
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required (username, email, password)' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      console.log(`❌ ${field} already exists`);
      return res.status(400).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }

    // Create user
    const user = new User({ 
      username, 
      email: email.toLowerCase(), 
      password 
    });
    
    await user.save();
    console.log('✅ User created:', user.username);

    const token = user.generateToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔑 Login request:', { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    console.log('✅ Login successful:', user.username);

    const token = user.generateToken();

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: 'online',
        settings: user.settings,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

app.post('/api/auth/logout', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { 
      status: 'offline', 
      lastSeen: new Date() 
    });
    
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ 
    success: true, 
    data: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      status: req.user.status,
      statusMessage: req.user.statusMessage,
      settings: req.user.settings,
      createdAt: req.user.createdAt
    }
  });
});

app.put('/api/auth/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current and new password are required' 
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// ========== USER ROUTES ==========
app.get('/api/users', protect, async (req, res) => {
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

    res.json({ 
      success: true, 
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

app.get('/api/users/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('username email avatar status lastSeen').limit(10);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

app.get('/api/users/online', protect, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      status: 'online'
    }).select('username avatar status');

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get online users' });
  }
});

app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar status statusMessage lastSeen createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const { username, statusMessage, settings } = req.body;
    const updates = {};

    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be at least 3 characters' 
        });
      }
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      updates.username = username;
    }
    if (statusMessage !== undefined) updates.statusMessage = statusMessage;
    if (settings) updates.settings = { ...req.user.settings.toObject(), ...settings };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

app.put('/api/users/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    
    // Delete old avatar
    if (req.user.avatar && req.user.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, req.user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({ success: true, data: { avatar: avatarUrl }, user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: 'Avatar upload failed' });
  }
});

app.put('/api/users/status', protect, async (req, res) => {
  try {
    const { status, statusMessage } = req.body;
    const updates = {};
    
    if (status && ['online', 'offline', 'away', 'busy'].includes(status)) {
      updates.status = status;
    }
    if (statusMessage !== undefined) updates.statusMessage = statusMessage;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    
    // Broadcast status change
    io.emit('user-status', { userId: req.user._id, status: user.status });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

app.post('/api/users/:id/block', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: req.params.id }
    });
    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
});

app.delete('/api/users/:id/block', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.id }
    });
    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
});

// ========== CONVERSATION ROUTES ==========
app.get('/api/conversations', protect, async (req, res) => {
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
        const participant = conv.participants.find(
          p => p.user._id.toString() === req.user._id.toString()
        );
        
        convObj.unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          createdAt: { $gt: participant?.lastRead || new Date(0) }
        });
        
        return convObj;
      })
    );

    res.json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversations' });
  }
});

app.get('/api/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    })
    .populate('participants.user', 'username avatar status lastSeen statusMessage')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
});

app.post('/api/conversations/private', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      type: 'private',
      'participants.user': { $all: [req.user._id, userId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] }
    }).populate('participants.user', 'username avatar status lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        participants: [
          { user: req.user._id, role: 'member' },
          { user: userId, role: 'member' }
        ]
      });
      await conversation.populate('participants.user', 'username avatar status lastSeen');
    }

    const convObj = conversation.toObject();
    convObj.unreadCount = 0;

    res.json({ success: true, data: convObj });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

app.post('/api/conversations/group', protect, async (req, res) => {
  try {
    const { name, description, participants } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!participants || !Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ success: false, message: 'At least one participant is required' });
    }

    const conversation = await Conversation.create({
      type: 'group',
      participants: [
        { user: req.user._id, role: 'admin' },
        ...participants.map(id => ({ user: id, role: 'member' }))
      ],
      groupInfo: {
        name,
        description: description || '',
        createdBy: req.user._id
      }
    });

    // Create system message
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} created the group "${name}"`,
      type: 'system'
    });

    await conversation.populate('participants.user', 'username avatar status');

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

app.put('/api/conversations/:id/group', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const participant = conversation.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participant?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update group settings' });
    }

    if (name) conversation.groupInfo.name = name;
    if (description !== undefined) conversation.groupInfo.description = description;

    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update group' });
  }
});

app.post('/api/conversations/:id/participants', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can add participants' });
    }

    const isAlreadyParticipant = conversation.participants.some(
      p => p.user.toString() === userId
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({ success: false, message: 'User is already in the group' });
    }

    conversation.participants.push({ user: userId, role: 'member' });
    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    const newUser = await User.findById(userId);
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} added ${newUser.username} to the group`,
      type: 'system'
    });

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add participant' });
  }
});

app.delete('/api/conversations/:id/participants/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group'
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.role === 'admin'
    );

    if (!isAdmin && userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const removedUser = await User.findById(userId);
    
    conversation.participants = conversation.participants.filter(
      p => p.user.toString() !== userId
    );

    await conversation.save();
    await conversation.populate('participants.user', 'username avatar status');

    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${removedUser.username} was removed from the group`,
      type: 'system'
    });

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove participant' });
  }
});

app.post('/api/conversations/:id/leave', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    conversation.participants = conversation.participants.filter(
      p => p.user.toString() !== req.user._id.toString()
    );

    if (conversation.participants.length === 0) {
      conversation.isActive = false;
    }

    await conversation.save();

    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `${req.user.username} left the group`,
      type: 'system'
    });

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
});

app.put('/api/conversations/:id/read', protect, async (req, res) => {
  try {
    await Conversation.updateOne(
      { _id: req.params.id, 'participants.user': req.user._id },
      { $set: { 'participants.$.lastRead': new Date() } }
    );

    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

app.delete('/api/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conversation.isActive = false;
    await conversation.save();

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
});

// ========== MESSAGE ROUTES ==========
app.get('/api/messages/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const query = { conversation: conversationId, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'username avatar');

    const total = await Message.countDocuments({ conversation: conversationId, isDeleted: false });

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

app.post('/api/messages', protect, async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo, attachments } = req.body;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Message content or attachments required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      type,
      readBy: [{ user: req.user._id, readAt: new Date() }]
    };

    if (replyTo) messageData.replyTo = replyTo;
    if (attachments) messageData.attachments = attachments;

    const message = await Message.create(messageData);

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastActivity: new Date()
    });

    await message.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'username' } }
    ]);

    // Emit to all participants
    conversation.participants.forEach(participant => {
      const userId = participant.user.toString();
      const sockets = getUserSockets(userId);
      sockets.forEach(socketId => {
        io.to(socketId).emit('new-message', { message, conversationId });
      });
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

app.put('/api/messages/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check edit window (15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(403).json({ success: false, message: 'Cannot edit messages older than 15 minutes' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username avatar');

    // Emit update
    io.to(`conversation:${message.conversation}`).emit('message-updated', { message });

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
});

app.delete('/api/messages/:id', protect, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    // Emit deletion
    io.to(`conversation:${message.conversation}`).emit('message-deleted', {
      messageId: message._id,
      conversationId: message.conversation
    });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

app.post('/api/messages/:id/reactions', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({ emoji, user: req.user._id });
    await message.save();
    await message.populate('reactions.user', 'username avatar');

    // Emit reaction update
    io.to(`conversation:${message.conversation}`).emit('message-reaction', {
      messageId: message._id,
      reactions: message.reactions,
      conversationId: message.conversation
    });

    res.json({ success: true, data: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add reaction' });
  }
});

app.delete('/api/messages/:id/reactions', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );
    await message.save();

    io.to(`conversation:${message.conversation}`).emit('message-reaction', {
      messageId: message._id,
      reactions: message.reactions,
      conversationId: message.conversation
    });

    res.json({ success: true, data: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove reaction' });
  }
});

app.get('/api/messages/search', protect, async (req, res) => {
  try {
    const { q, conversationId, page = 1, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const query = {
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    };

    if (conversationId) {
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
      .populate('conversation', 'type groupInfo');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// ========== UPLOAD ROUTES ==========
app.post('/api/upload', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.status(201).json({ success: true, data: attachments });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.post('/api/upload/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.delete('/api/upload/:filename', protect, async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ========== CHATBOT ROUTES ==========
const chatbotHistory = new Map();

const chatbotPatterns = [
  { regex: /^(hi|hello|hey|greetings)/i, responses: ['Hello! 👋', 'Hi there!', 'Hey! How can I help?'] },
  { regex: /^(bye|goodbye|see you)/i, responses: ['Goodbye! 👋', 'See you later!', 'Take care!'] },
  { regex: /(joke|funny)/i, responses: [
    "Why don't scientists trust atoms? They make up everything! 😄",
    "What do you call a fake noodle? An impasta! 🍝",
    "Why did the scarecrow win an award? Outstanding in his field! 🌾"
  ]},
  { regex: /(fact|interesting)/i, responses: [
    "Honey never spoils! 🍯",
    "Octopuses have three hearts! 🐙",
    "A day on Venus is longer than a year! 🌟"
  ]},
  { regex: /(time|clock)/i, handler: () => `It's ${new Date().toLocaleTimeString()} ⏰` },
  { regex: /(date|today)/i, handler: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 📅` },
  { regex: /how are you/i, responses: ["I'm great, thanks! 😊", "Doing well! How about you?"] },
  { regex: /(thank|thanks)/i, responses: ["You're welcome! 😊", "Happy to help!"] },
  { regex: /(help|what can you do)/i, responses: ["I can: tell jokes 🎭, share facts 📚, tell time ⏰, and chat! Try asking me something!"] }
];

const getChatbotResponse = (message) => {
  for (const pattern of chatbotPatterns) {
    if (pattern.regex.test(message)) {
      if (pattern.handler) return pattern.handler();
      return pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
    }
  }
  
  // Math calculation
  const mathMatch = message.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const [, a, op, b] = mathMatch;
    let result;
    switch (op) {
      case '+': result = parseFloat(a) + parseFloat(b); break;
      case '-': result = parseFloat(a) - parseFloat(b); break;
      case '*': result = parseFloat(a) * parseFloat(b); break;
      case '/': result = parseFloat(b) !== 0 ? parseFloat(a) / parseFloat(b) : 'Cannot divide by zero'; break;
    }
    return `${a} ${op} ${b} = ${result} 🔢`;
  }

  const defaults = ["Interesting! Tell me more 🤔", "I see! 💭", "That's cool! 😊"];
  return defaults[Math.floor(Math.random() * defaults.length)];
};

app.post('/api/chatbot/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const response = getChatbotResponse(message);

    // Store history
    const oddduserId = req.user._id.toString();
    if (!chatbotHistory.has(userId)) {
      chatbotHistory.set(userId, []);
    }
    const history = chatbotHistory.get(userId);
    history.push({ role: 'user', content: message, timestamp: new Date() });
    history.push({ role: 'bot', content: response, timestamp: new Date() });
    if (history.length > 100) history.splice(0, history.length - 100);

    res.json({ success: true, data: { userMessage: message, botResponse: response } });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ success: false, message: 'Chatbot error' });
  }
});

app.get('/api/chatbot/history', protect, (req, res) => {
  const history = chatbotHistory.get(req.user._id.toString()) || [];
  res.json({ success: true, data: history });
});

app.delete('/api/chatbot/history', protect, (req, res) => {
  chatbotHistory.delete(req.user._id.toString());
  res.json({ success: true, message: 'History cleared' });
});

// ==================== SOCKET.IO ====================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log(`✅ Socket connected: ${socket.user.username} (${socket.id})`);
  
  // Add to socket map
  addUserSocket(socket.userId, socket.id);

  // Update user status
  await User.findByIdAndUpdate(socket.userId, { status: 'online', lastSeen: new Date() });
  socket.broadcast.emit('user-status', { userId: socket.userId, status: 'online' });

  // Join conversation rooms
  const conversations = await Conversation.find({ 
    'participants.user': socket.userId,
    isActive: true 
  }).select('_id');
  
  conversations.forEach(conv => {
    socket.join(`conversation:${conv._id}`);
  });

  // Join personal room
  socket.join(`user:${socket.userId}`);

  // ===== Socket Event Handlers =====

  // Typing indicators
  socket.on('typing-start', async ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      conversationId,
      userId: socket.userId,
      username: socket.user.username,
      isTyping: true
    });
  });

  socket.on('typing-stop', async ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      conversationId,
      userId: socket.userId,
      username: socket.user.username,
      isTyping: false
    });
  });

  // Read receipts
  socket.on('mark-read', async ({ conversationId, messageIds }) => {
    try {
      await Conversation.updateOne(
        { _id: conversationId, 'participants.user': socket.userId },
        { $set: { 'participants.$.lastRead': new Date() } }
      );

      if (messageIds?.length) {
        await Message.updateMany(
          { _id: { $in: messageIds }, 'readBy.user': { $ne: socket.userId } },
          { $push: { readBy: { user: socket.userId, readAt: new Date() } } }
        );
      }

      socket.to(`conversation:${conversationId}`).emit('messages-read', {
        conversationId,
        readBy: socket.userId,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Join/Leave rooms
  socket.on('join-conversation', async (conversationId) => {
    try {
      const conv = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.userId
      });
      if (conv) {
        socket.join(`conversation:${conversationId}`);
        socket.emit('joined-conversation', { conversationId });
      }
    } catch (error) {
      console.error('Join conversation error:', error);
    }
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Presence
  socket.on('update-presence', async ({ status }) => {
    if (['online', 'away', 'busy', 'offline'].includes(status)) {
      await User.findByIdAndUpdate(socket.userId, { status });
      socket.broadcast.emit('user-status', { userId: socket.userId, status });
    }
  });

  socket.on('get-online-users', async () => {
    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit('online-users', onlineUserIds);
  });

  // Disconnect
  socket.on('disconnect', async (reason) => {
    console.log(`❌ Socket disconnected: ${socket.user.username} (${reason})`);
    
    removeUserSocket(socket.userId, socket.id);

    // If no more connections, set offline
    if (!isUserOnline(socket.userId)) {
      await User.findByIdAndUpdate(socket.userId, { 
        status: 'offline', 
        lastSeen: new Date() 
      });
      socket.broadcast.emit('user-status', { 
        userId: socket.userId, 
        status: 'offline',
        lastSeen: new Date()
      });
    }
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      success: false, 
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ==================== START SERVER ====================
console.log('🔄 Connecting to MongoDB...');
console.log(`   URI: ${MONGODB_URI}`);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`🌐 Client URL: ${CLIENT_URL}`);
      console.log('');
      console.log('Ready to accept connections!');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('');
    console.log('Make sure MongoDB is running:');
    console.log('  - Local: mongod or sudo systemctl start mongod');
    console.log('  - Docker: docker run -d -p 27017:27017 mongo:7');
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});