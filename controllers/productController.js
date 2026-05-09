const Product = require('../models/Product');
const Category = require('../models/Category');

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

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (categoryId) {
        filter.category = categoryId;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('seller', 'name email')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create product (sellers only)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, inventory, image } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const categoryId = await resolveCategoryId(category);

    if (!categoryId) {
      return res.status(400).json({ error: 'Please provide a valid category' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category: categoryId,
      inventory: inventory || 0,
      image,
      seller: req.user.id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update product (seller or admin only)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    if (req.body.category) {
      const categoryId = await resolveCategoryId(req.body.category);
      if (!categoryId) {
        return res.status(400).json({ error: 'Please provide a valid category' });
      }
      req.body.category = categoryId;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update product stock (seller only)
// @route   PUT /api/products/:id/stock
exports.updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock == null || stock < 0) {
      return res.status(400).json({ error: 'Please provide a valid stock value' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check seller ownership
    const sellerId = product.seller || product.sellerId || product.seller_id;
    if (sellerId && sellerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update stock for this product' });
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete product (seller or admin only)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
