const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createComment,
  getProductComments,
  getCommentSummary,
} = require('../controllers/commentController');

const router = express.Router();

router.get('/item/:id', getProductComments);
router.get('/item/:id/summary', getCommentSummary);
router.post('/', protect, createComment);

module.exports = router;