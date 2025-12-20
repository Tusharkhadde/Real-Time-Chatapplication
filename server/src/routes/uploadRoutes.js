const express = require('express');
const router = express.Router();
const {
  uploadFiles,
  uploadSingle,
  deleteAttachment,
  getAttachment
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/', uploadLimiter, upload.array('files', 10), uploadFiles);
router.post('/single', uploadLimiter, upload.single('file'), uploadSingle);
router.get('/:id', getAttachment);
router.delete('/:id', deleteAttachment);

module.exports = router;