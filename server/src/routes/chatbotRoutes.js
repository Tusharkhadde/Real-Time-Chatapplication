const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getHistory,
  clearHistory,
  getCapabilities
} = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/message', sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.get('/capabilities', getCapabilities);

module.exports = router;