const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: String,
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    default: 'other'
  },
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number, // For audio/video
  thumbnail: String,
  isLocal: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
attachmentSchema.index({ uploader: 1, createdAt: -1 });

// Get file type from mime type
attachmentSchema.statics.getFileType = function(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('text') ||
      mimeType.includes('sheet') ||
      mimeType.includes('presentation')) {
    return 'document';
  }
  return 'other';
};

module.exports = mongoose.model('Attachment', attachmentSchema);