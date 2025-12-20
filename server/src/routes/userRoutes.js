const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateProfile,
  updateAvatar,
  updateStatus,
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers,
  getOnlineUsers
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');

router.use(protect);

router.get('/', getUsers);
router.get('/search', searchUsers);
router.get('/online', getOnlineUsers);
router.get('/blocked', getBlockedUsers);
router.get('/:id', getUser);

router.put('/profile', updateProfile);
router.put('/avatar', avatarUpload.single('avatar'), updateAvatar);
router.put('/status', updateStatus);

router.post('/:id/block', blockUser);
router.delete('/:id/block', unblockUser);

module.exports = router;