const Comment = require('../models/Comment');
const Product = require('../models/Product');
const { generateCommentSummary } = require('../services/grokSummaryService');

const summarizeCommentsLocal = (productName, comments) => {
  const visibleComments = comments
    .slice(0, 20)
    .map((comment, index) => `${index + 1}. ${comment.text}`)
    .join('\n');

  const text = visibleComments || '';
  const lc = text.toLowerCase();
  const counts = {
    delivery: (lc.match(/deliver|delivery|late|delay|delayed/g) || []).length,
    quality: (lc.match(/quality|broken|faulty|defect|damag|scratch/g) || []).length,
    packaging: (lc.match(/packag|box|wrap|sealed/g) || []).length,
    praise: (lc.match(/good|great|excellent|love|recommend|nice/g) || []).length,
    negative: (lc.match(/bad|terrible|awful|hate|worst/g) || []).length,
  };

  const themes = [];
  if (counts.delivery) themes.push(`delivery issues (${counts.delivery})`);
  if (counts.quality) themes.push(`quality complaints (${counts.quality})`);
  if (counts.packaging) themes.push(`packaging notes (${counts.packaging})`);
  if (counts.praise) themes.push(`positive mentions (${counts.praise})`);
  if (counts.negative) themes.push(`negative mentions (${counts.negative})`);

  const commentCount = comments.length || 0;
  const overallSentiment = counts.praise >= counts.negative ? (counts.praise > counts.negative ? 'mostly positive' : 'mixed') : 'mostly negative';

  return commentCount === 0
    ? 'No comments yet for this product.'
    : `Summary: ${commentCount} comments. Common themes: ${themes.length ? themes.join(', ') : 'no clear recurring themes'}. Overall sentiment: ${overallSentiment}.`;
};

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
    const [product, comments] = await Promise.all([
      Product.findById(req.params.id).select('name'),
      Comment.find({ product: req.params.id }).select('text'),
    ]);

    if (comments.length === 0) {
      return res.status(200).json({ summary: 'No comments yet for this product.' });
    }

    try {
      const aiSummary = await generateCommentSummary({ productName: product?.name, comments });
      return res.status(200).json({ summary: aiSummary });
    } catch (aiErr) {
      // If AI fails, fall back to local summary so the endpoint remains useful
      const local = summarizeCommentsLocal(product?.name, comments);
      return res.status(200).json({ summary: local, aiError: String(aiErr.message || aiErr) });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
};