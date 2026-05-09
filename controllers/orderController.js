const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const BuyerLocation = require('../models/BuyerLocation');
const DeliveryZone = require('../models/DeliveryZone');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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

const populateOrderProducts = () => ({
  path: 'items.product',
  select: 'name price sellerId',
  populate: {
    path: 'sellerId',
    select: 'name businessName',
  },
});

const getSellerIdValue = (sellerId) => {
  if (!sellerId) return null;
  if (typeof sellerId === 'object') {
    return sellerId._id?.toString?.() || sellerId.toString?.() || null;
  }
  return sellerId.toString();
};

const buildSellerOrderView = (order, sellerId) => {
  if (!order) return null;

  const sellerIdValue = getSellerIdValue(sellerId);
  const orderObject = typeof order.toObject === 'function' ? order.toObject() : { ...order };

  const sellerItems = (orderObject.items || []).filter((item) => {
    const productSellerId = item?.product?.sellerId;
    return getSellerIdValue(productSellerId) === sellerIdValue;
  });

  if (sellerItems.length === 0) {
    return null;
  }

  const sellerTotalPrice = sellerItems.reduce((sum, item) => {
    const itemPrice = Number(item.price || 0);
    const itemQuantity = Number(item.quantity || 0);
    return sum + itemPrice * itemQuantity;
  }, 0);

  return {
    ...orderObject,
    items: sellerItems,
    totalPrice: sellerTotalPrice,
  };
};

const userOwnsOrderAsSeller = (order, sellerId) => {
  return order.items.some((item) => {
    const product = item.product;
    if (!product || !product.sellerId) return false;
    return product.sellerId._id?.toString?.() === sellerId || product.sellerId.toString() === sellerId;
  });
};

const ensureOrderServiceability = async (buyerId, items) => {
  const buyerLocation = await BuyerLocation.findOne({ buyerId });
  if (!buyerLocation) {
    return { ok: false, status: 400, error: 'Location required', message: 'Please enable location services to place an order' };
  }

  for (const item of items) {
    const productId = item.product || item.itemId;
    const product = await Product.findById(productId).select('sellerId name');

    if (!product) {
      return { ok: false, status: 404, error: 'Product not found', message: `Product ${productId} not found` };
    }

    const zones = await DeliveryZone.find({ sellerId: product.sellerId, isActive: true });
    if (zones.length === 0) {
      continue;
    }

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
      return {
        ok: false,
        status: 400,
        error: 'Out of delivery zone',
        message: `This seller does not deliver to your location`,
      };
    }
  }

  return { ok: true };
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

    const serviceability = await ensureOrderServiceability(req.user.id, items);
    if (!serviceability.ok) {
      return res.status(serviceability.status).json({ error: serviceability.error, message: serviceability.message });
    }

    let totalPrice = 0;
    const orderItems = [];

    // Validate items, calculate total and estimate delivery
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

    // estimate delivery: use the maximum deliveryTimeEstimate among items (in days)
    let maxDeliveryDays = 0;
    for (const item of items) {
      const productId = item.product || item.itemId;
      const product = await Product.findById(productId).select('deliveryTimeEstimate');
      const days = Number(product?.deliveryTimeEstimate || 1);
      if (days > maxDeliveryDays) maxDeliveryDays = days;
    }

    const estimatedDeliveryDate = new Date(Date.now() + maxDeliveryDays * 24 * 60 * 60 * 1000);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
      shippingAddress: address,
      estimatedDeliveryDate,
      comments: [],
    });

    // Decrement stock for each ordered item
    for (const item of orderItems) {
      const productId = item.product;
      const qty = item.quantity;
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -qty } });
    }

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

    const sellerOrders = orders
      .map((order) => buildSellerOrderView(order, req.user.id))
      .filter(Boolean);

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

    if (isSeller && !isBuyer) {
      const sellerOrder = buildSellerOrderView(order, req.user.id);

      return res.status(200).json({
        success: true,
        order: sellerOrder,
      });
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
