const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary only if enabled
if (process.env.USE_CLOUDINARY === 'true') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadToCloudinary = async (filePath, folder = 'chat_uploads') => {
  if (process.env.USE_CLOUDINARY !== 'true') {
    // Return local path if Cloudinary is not enabled
    const filename = path.basename(filePath);
    return {
      url: `/uploads/${filename}`,
      publicId: filename,
      isLocal: true
    };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto'
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isLocal: false
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (process.env.USE_CLOUDINARY !== 'true') {
    // Delete local file
    const filePath = path.join(__dirname, '../../uploads', publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};