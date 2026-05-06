const express = require('express');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();

// Get all items with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (search) filter.name = { $regex: search, $options: 'i' };
      if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    
    const items = await Product.find(filter)
      .populate('sellerId', 'name businessName');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Product.findById(req.params.id)
      .populate('sellerId', 'name businessName');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// Create new item (seller only)
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, category, price, stock, deliveryTimeEstimate, images } = req.body;
    
    if (!name || !description || !category || !price || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, description, category, price, stock' });
    }
    const item = await Product.create({
      name,
      description,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      deliveryTimeEstimate: parseInt(deliveryTimeEstimate) || 1,
      images: images || [],
      sellerId: req.user.id,
    });

    // Ensure category exists in Category collection (upsert)
    if (category) {
      try {
        await Category.findOneAndUpdate(
          { name: category },
          { name: category },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (catErr) {
        // log but don't block item creation
        console.error('Category upsert error:', catErr.message);
      }
    }
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
});

// Update item
router.put('/:id', protect, async (req, res) => {
  try {
    let item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    const oldCategory = item.category;

    item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // If category changed, ensure new category exists in Category collection
    const newCategory = item.category;
    if (newCategory && newCategory !== oldCategory) {
      try {
        await Category.findOneAndUpdate(
          { name: newCategory },
          { name: newCategory },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (catErr) {
        console.error('Category upsert error:', catErr.message);
      }
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});

// Delete item
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

module.exports = router;
