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

// Validate message type
const isValidMessageType = (type) => {
  return ['text', 'image', 'video', 'audio', 'file', 'poll', 'system'].includes(type);
};

// Validate poll data
const isValidPoll = (poll) => {
  if (!poll || typeof poll !== 'object') return false;
  if (!poll.question || typeof poll.question !== 'string' || poll.question.trim().length === 0) return false;
  if (poll.question.length > 500) return false;
  if (!Array.isArray(poll.options) || poll.options.length < 2) return false;
  if (poll.options.length > 10) return false; // Max 10 options
  
  // Validate each option
  for (const option of poll.options) {
    if (!option.text || typeof option.text !== 'string' || option.text.trim().length === 0) {
      return false;
    }
    if (option.text.length > 200) return false; // Max 200 chars per option
  }
  
  return true;
};

// Validate poll option
const isValidPollOption = (option) => {
  if (!option || typeof option !== 'object') return false;
  if (!option.text || typeof option.text !== 'string') return false;
  if (option.text.trim().length === 0 || option.text.length > 200) return false;
  return true;
};

// Validate message data (comprehensive validation)
const validateMessageData = (data) => {
  const errors = {};

  // Validate conversation ID
  if (!data.conversationId) {
    errors.conversationId = 'Conversation ID is required';
  } else if (!isValidObjectId(data.conversationId)) {
    errors.conversationId = 'Invalid conversation ID';
  }

  // Validate message type
  if (data.type && !isValidMessageType(data.type)) {
    errors.type = 'Invalid message type';
  }

  // Validate content - NOT required for poll type
  if (!data.content && data.type !== 'poll') {
    // Check if it's a file/attachment message
    if (!data.attachmentIds || data.attachmentIds.length === 0) {
      errors.content = 'Message content is required';
    }
  } else if (data.content && data.content.length > 5000) {
    errors.content = 'Message content too long (max 5000 characters)';
  }

  // Validate poll data if type is poll
  if (data.type === 'poll') {
    if (!data.poll) {
      errors.poll = 'Poll data is required for poll messages';
    } else {
      if (!data.poll.question || data.poll.question.trim().length === 0) {
        errors.pollQuestion = 'Poll question is required';
      } else if (data.poll.question.length > 500) {
        errors.pollQuestion = 'Poll question too long (max 500 characters)';
      }

      if (!Array.isArray(data.poll.options)) {
        errors.pollOptions = 'Poll options must be an array';
      } else if (data.poll.options.length < 2) {
        errors.pollOptions = 'Poll must have at least 2 options';
      } else if (data.poll.options.length > 10) {
        errors.pollOptions = 'Poll cannot have more than 10 options';
      } else {
        // Validate each option
        const invalidOptions = data.poll.options.filter(
          opt => !opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0
        );
        if (invalidOptions.length > 0) {
          errors.pollOptions = 'All poll options must have valid text';
        }

        // Check for duplicate options
        const optionTexts = data.poll.options.map(opt => opt.text?.trim().toLowerCase());
        const hasDuplicates = optionTexts.length !== new Set(optionTexts).size;
        if (hasDuplicates) {
          errors.pollOptions = 'Poll options must be unique';
        }
      }

      // Validate expiresAt if provided
      if (data.poll.expiresAt) {
        const expiresAt = new Date(data.poll.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          errors.pollExpiry = 'Invalid expiry date';
        } else if (expiresAt <= new Date()) {
          errors.pollExpiry = 'Expiry date must be in the future';
        }
      }
    }
  }

  // Validate replyTo if provided
  if (data.replyTo && !isValidObjectId(data.replyTo)) {
    errors.replyTo = 'Invalid reply message ID';
  }

  // Validate attachmentIds if provided
  if (data.attachmentIds) {
    if (!Array.isArray(data.attachmentIds)) {
      errors.attachmentIds = 'Attachment IDs must be an array';
    } else {
      const invalidIds = data.attachmentIds.filter(id => !isValidObjectId(id));
      if (invalidIds.length > 0) {
        errors.attachmentIds = 'Invalid attachment ID(s)';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate forward message data
const validateForwardData = (data) => {
  const errors = {};

  if (!data.messageId) {
    errors.messageId = 'Original message ID is required';
  } else if (!isValidObjectId(data.messageId)) {
    errors.messageId = 'Invalid message ID';
  }

  if (!data.conversationId) {
    errors.conversationId = 'Target conversation ID is required';
  } else if (!isValidObjectId(data.conversationId)) {
    errors.conversationId = 'Invalid conversation ID';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate poll vote data
const validatePollVote = (data) => {
  const errors = {};

  if (data.optionId === undefined || data.optionId === null) {
    errors.optionId = 'Option ID is required';
  } else if (typeof data.optionId !== 'number' && typeof data.optionId !== 'string') {
    errors.optionId = 'Invalid option ID';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
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
  isValidUserStatus,
  isValidMessageType,
  isValidPoll,
  isValidPollOption,
  validateMessageData,
  validateForwardData,
  validatePollVote
};