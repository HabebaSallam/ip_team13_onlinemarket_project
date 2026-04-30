const Comment = require('../models/Comment');
const Product = require('../models/Product');

// @desc    Get comments for a product
// @route   GET /api/comments/item/:id
exports.getProductComments = async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a comment for a product
// @route   POST /api/comments
exports.createComment = async (req, res) => {
  try {
    const { productId, text } = req.body;

    if (!productId || !text) {
      return res.status(400).json({ error: 'Please provide productId and text' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const comment = await Comment.create({
      product: productId,
      user: req.user.id,
      text,
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get a simple summary for product comments
// @route   GET /api/comments/item/:id/summary
exports.getCommentSummary = async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.id });

    if (comments.length === 0) {
      return res.status(200).json({ summary: 'No comments yet for this product.' });
    }

    res.status(200).json({
      summary: `${comments.length} comment${comments.length === 1 ? '' : 's'} from buyers.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};