const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate username
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// Validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate file type
const isAllowedFileType = (mimeType, allowedTypes) => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1));
    }
    return mimeType === type;
  });
};

// Validate file size (in bytes)
const isValidFileSize = (size, maxSize) => {
  return size <= maxSize;
};

// Sanitize HTML (basic)
const sanitizeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validate message content
const isValidMessageContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  if (content.trim().length === 0) return false;
  if (content.length > 5000) return false;
  return true;
};

// Validate conversation type
const isValidConversationType = (type) => {
  return ['private', 'group'].includes(type);
};

// Validate user status
const isValidUserStatus = (status) => {
  return ['online', 'offline', 'away', 'busy'].includes(status);
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidUsername,
  isStrongPassword,
  isValidUrl,
  isAllowedFileType,
  isValidFileSize,
  sanitizeHtml,
  isValidMessageContent,
  isValidConversationType,
  isValidUserStatus
};