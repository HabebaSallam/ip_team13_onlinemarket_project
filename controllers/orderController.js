const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Please provide order items' });
    }

    let totalPrice = 0;
    const orderItems = [];

    // Validate items and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({ error: `Not enough inventory for ${product.name}` });
      }

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
      });

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
      shippingAddress,
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
      .populate('items.product', 'name price')
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

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns order
    if (order.user._id.toString() !== req.user.id) {
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
