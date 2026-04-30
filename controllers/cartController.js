const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price image inventory');

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Please provide productId and quantity' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check inventory
    if (product.inventory < quantity) {
      return res.status(400).json({ error: 'Not enough inventory' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }],
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find((item) => item.product.toString() === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name price image');

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Remove item from cart
// @route   POST /api/cart/remove
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Please provide productId' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    await cart.save();
    await cart.populate('items.product', 'name price image');

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update cart item quantity
// @route   POST /api/cart/update
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Please provide productId and quantity' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const cartItem = cart.items.find((item) => item.product.toString() === productId);

    if (!cartItem) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    } else {
      cartItem.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price image');

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
