const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  searchMessages,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/search', searchMessages);
router.get('/:conversationId', getMessages);

router.post('/', messageLimiter, sendMessage);

router.put('/:id', editMessage);
router.put('/:id/read', markAsRead);

router.delete('/:id', deleteMessage);

router.post('/:id/reactions', addReaction);
router.delete('/:id/reactions', removeReaction);

module.exports = router;