const express = require('express');
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Product = require('../models/Product');

const router = express.Router();

router.get('/item/:itemId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.itemId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { itemId, rating } = req.body;

    if (!itemId || !rating) {
      return res.status(400).json({ error: 'Please provide itemId and rating' });
    }

    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingReview = await Review.findOne({ product: itemId, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({ error: 'You already reviewed this product' });
    }

    const createdReview = await Review.create({
      product: itemId,
      user: req.user.id,
      rating,
    });

    const allReviews = await Review.find({ product: itemId });
    const avgRating = allReviews.reduce((sum, current) => sum + current.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(itemId, {
      rating: avgRating,
      reviews: allReviews.length,
    });

    res.status(201).json({ success: true, review: createdReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;