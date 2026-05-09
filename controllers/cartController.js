const Cart = require('../models/Cart');
const Product = require('../models/Product');
const BuyerLocation = require('../models/BuyerLocation');
const DeliveryZone = require('../models/DeliveryZone');

// Calculate distance between two coordinates using Haversine formula (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Returns true if buyer may order this seller's products at their current location */
async function assertBuyerServiceableForSeller(buyerId, sellerId) {
  const buyerLocation = await BuyerLocation.findOne({ buyerId });
  if (!buyerLocation) {
    const err = new Error('LOCATION_REQUIRED');
    err.statusCode = 400;
    err.payload = {
      error: 'Location required',
      message: 'Please enable location services to add items to cart',
    };
    throw err;
  }

  const zones = await DeliveryZone.find({ sellerId, isActive: true });
  if (zones.length === 0) return;

  const isServiceable = zones.some((zone) => {
    const distance = calculateDistance(
      buyerLocation.latitude,
      buyerLocation.longitude,
      zone.latitude,
      zone.longitude
    );
    return distance <= zone.radius;
  });

  if (!isServiceable) {
    const err = new Error('OUT_OF_ZONE');
    err.statusCode = 400;
    err.payload = {
      error: 'Out of delivery zone',
      message: 'This seller does not deliver to your location',
    };
    throw err;
  }
}

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
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough inventory' });
    }

    try {
      await assertBuyerServiceableForSeller(req.user.id, product.sellerId);
    } catch (e) {
      if (e.statusCode && e.payload) {
        return res.status(e.statusCode).json(e.payload);
      }
      throw e;
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
    await cart.populate('items.product', 'name price image stock');

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
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Not enough inventory' });
      }
      try {
        await assertBuyerServiceableForSeller(req.user.id, product.sellerId);
      } catch (e) {
        if (e.statusCode && e.payload) {
          return res.status(e.statusCode).json(e.payload);
        }
        throw e;
      }
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
