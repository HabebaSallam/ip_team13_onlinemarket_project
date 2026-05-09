const express = require('express');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();

const resolveCategoryId = async (categoryValue) => {
  if (!categoryValue) return null;

  const categoryText = String(categoryValue);

  if (categoryText.match(/^[0-9a-fA-F]{24}$/)) {
    const existingCategory = await Category.findById(categoryText);
    return existingCategory ? existingCategory._id : null;
  }

  const category = await Category.findOneAndUpdate(
    { name: categoryText },
    { name: categoryText },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return category._id;
};

// Get all items with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let filter = {};

    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (categoryId) filter.category = categoryId;
    }
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (search) filter.name = { $regex: search, $options: 'i' };
      if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    
    const items = await Product.find(filter)
      .populate('sellerId', 'name businessName')
      .populate('category', 'name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
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
    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const item = await Product.create({
      name,
      description,
      category: categoryId,
      price: parseFloat(price),
      stock: parseInt(stock),
      deliveryTimeEstimate: parseInt(deliveryTimeEstimate) || 1,
      images: images || [],
      sellerId: req.user.id,
    });
    
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

    if (req.body.category) {
      const categoryId = await resolveCategoryId(req.body.category);
      if (!categoryId) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      req.body.category = categoryId;
    }

    item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
