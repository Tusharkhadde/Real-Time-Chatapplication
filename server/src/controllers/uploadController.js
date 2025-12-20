const Attachment = require('../models/Attachment');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Upload files
// @route   POST /api/upload
// @access  Private
exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const attachments = [];

    for (const file of req.files) {
      const fileType = Attachment.getFileType(file.mimetype);
      
      let uploadResult;
      let dimensions = null;
      let thumbnail = null;

      // Process images
      if (fileType === 'image') {
        try {
          const metadata = await sharp(file.path).metadata();
          dimensions = {
            width: metadata.width,
            height: metadata.height
          };

          // Create thumbnail for images
          const thumbnailFilename = `thumb-${file.filename}`;
          const thumbnailPath = path.join(path.dirname(file.path), thumbnailFilename);
          
          await sharp(file.path)
            .resize(200, 200, { fit: 'cover' })
            .webp({ quality: 70 })
            .toFile(thumbnailPath);

          thumbnail = `/uploads/${thumbnailFilename}`;
        } catch (err) {
          console.error('Image processing error:', err);
        }
      }

      // Upload to cloudinary or use local path
      uploadResult = await uploadToCloudinary(file.path);

      const attachment = await Attachment.create({
        uploader: req.user._id,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        type: fileType,
        dimensions,
        thumbnail,
        isLocal: uploadResult.isLocal
      });

      attachments.push(attachment);
    }

    res.status(201).json({
      success: true,
      data: attachments
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
};

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const fileType = Attachment.getFileType(file.mimetype);
    
    let dimensions = null;

    if (fileType === 'image') {
      try {
        const metadata = await sharp(file.path).metadata();
        dimensions = {
          width: metadata.width,
          height: metadata.height
        };
      } catch (err) {
        console.error('Image processing error:', err);
      }
    }

    const uploadResult = await uploadToCloudinary(file.path);

    const attachment = await Attachment.create({
      uploader: req.user._id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      type: fileType,
      dimensions,
      isLocal: uploadResult.isLocal
    });

    res.status(201).json({
      success: true,
      data: attachment
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/upload/:id
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findOne({
      _id: req.params.id,
      uploader: req.user._id
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Delete from storage
    if (attachment.isLocal) {
      const filePath = path.join(__dirname, '../..', attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete thumbnail if exists
      if (attachment.thumbnail) {
        const thumbPath = path.join(__dirname, '../..', attachment.thumbnail);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    } else {
      await deleteFromCloudinary(attachment.publicId);
    }

    await attachment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment'
    });
  }
};

// @desc    Get attachment
// @route   GET /api/upload/:id
// @access  Private
exports.getAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attachment
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachment'
    });
  }
};