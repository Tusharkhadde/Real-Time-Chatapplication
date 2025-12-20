const express = require('express');
const router = express.Router();
const {
  getConversations,
  getConversation,
  createPrivateConversation,
  createGroupConversation,
  updateGroup,
  addParticipant,
  removeParticipant,
  leaveGroup,
  markAsRead,
  deleteConversation
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getConversations);
router.get('/:id', getConversation);

router.post('/private', createPrivateConversation);
router.post('/group', createGroupConversation);

router.put('/:id/group', updateGroup);
router.put('/:id/read', markAsRead);

router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:userId', removeParticipant);
router.post('/:id/leave', leaveGroup);

router.delete('/:id', deleteConversation);

module.exports = router;