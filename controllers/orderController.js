const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const populateOrderProducts = () => ({
  path: 'items.product',
  select: 'name price sellerId',
  populate: {
    path: 'sellerId',
    select: 'name businessName',
  },
});

const userOwnsOrderAsSeller = (order, sellerId) => {
  return order.items.some((item) => {
    const product = item.product;
    if (!product || !product.sellerId) return false;
    return product.sellerId._id?.toString?.() === sellerId || product.sellerId.toString() === sellerId;
  });
};

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, deliveryAddress } = req.body;
    const address = shippingAddress || deliveryAddress;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Please provide order items' });
    }

    let totalPrice = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const productId = item.product || item.itemId;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: `Product ${productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough inventory for ${product.name}` });
      }

      orderItems.push({
        product: productId,
        quantity: item.quantity,
        price: item.price || product.price,
      });

      totalPrice += (item.price || product.price) * item.quantity;
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
      shippingAddress: address,
      comments: [],
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate(populateOrderProducts())
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/my-orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate(populateOrderProducts())
      .sort({ createdAt: -1 });

    const sellerOrders = orders.filter((order) => userOwnsOrderAsSeller(order, req.user.id));

    res.status(200).json({
      success: true,
      count: sellerOrders.length,
      orders: sellerOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate(populateOrderProducts())
      .populate('comments.user', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isBuyer = order.user._id.toString() === req.user.id;
    const isSeller = userOwnsOrderAsSeller(order, req.user.id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Add comment to order
// @route   POST /api/orders/:id/comments
exports.addOrderComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Please provide comment text' });
    }

    const order = await Order.findById(req.params.id).populate(populateOrderProducts()).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isBuyer = order.user._id.toString() === req.user.id;
    const isSeller = userOwnsOrderAsSeller(order, req.user.id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to comment on this order' });
    }

    const user = await User.findById(req.user.id).select('userType');

    order.comments.push({
      text,
      user: req.user.id,
      userType: user?.userType === 'seller' ? 'seller' : 'buyer',
    });

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate(populateOrderProducts())
      .populate('comments.user', 'name');

    res.status(201).json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id
exports.updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status) {
      order.status = status;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending orders' });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
