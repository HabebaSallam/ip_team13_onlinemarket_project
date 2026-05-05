const Flag = require('../models/Flag');
const Order = require('../models/Order');
const User = require('../models/User');

const incrementFlagCounters = async (userId, userType) => {
  const increments = {};

  if (userType === 'buyer') {
    increments.buyerFlags = 1;
  } else if (userType === 'seller') {
    increments.sellerFlags = 1;
  } else {
    increments.flags = 1;
  }

  await User.findByIdAndUpdate(userId, {
    $inc: increments,
  });
};

// @desc    Create a flag against a user
// @route   POST /api/flags
exports.createFlag = async (req, res) => {
  try {
    const { flaggedUserId, reason, description } = req.body;

    if (!flaggedUserId || !reason) {
      return res.status(400).json({ error: 'Please provide flaggedUserId and reason' });
    }

    const flaggedUser = await User.findById(flaggedUserId);
    if (!flaggedUser) {
      return res.status(404).json({ error: 'Flagged user not found' });
    }

    const reportingUser = await User.findById(req.user.id).select('userType role');
    const reporterType = reportingUser?.userType || (reportingUser?.role === 'seller' ? 'seller' : 'buyer');

    const flag = await Flag.create({
      flaggedUserId,
      flaggedBy: req.user.id,
      reason,
      description: description || '',
    });

    const targetType = reporterType === 'buyer' ? 'seller' : 'buyer';
    await incrementFlagCounters(flaggedUserId, targetType);

    res.status(201).json({
      success: true,
      flag,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get flags against the current user
// @route   GET /api/flags/my-flags
exports.getMyFlags = async (req, res) => {
  try {
    const flags = await Flag.find({ flaggedUserId: req.user.id })
      .populate('flaggedBy', 'name email')
      .populate('orderId', '_id orderNumber status paymentMethod')
      .sort({ createdAt: -1 });

    res.status(200).json(flags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Flag a buyer for a specific order
// @route   POST /api/flags/orders/:orderId
exports.flagBuyerForOrder = async (req, res) => {
  try {
    const { reason = 'package_not_received', description = '' } = req.body;

    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email userType')
      .populate({
        path: 'items.product',
        select: 'sellerId',
      });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const sellerOwnsOrder = order.items.some((item) => {
      const sellerId = item.product?.sellerId;
      return sellerId && sellerId.toString() === req.user.id;
    });

    if (!sellerOwnsOrder) {
      return res.status(403).json({ error: 'Not authorized to flag this customer' });
    }

    if (!order.user) {
      return res.status(400).json({ error: 'Order buyer not found' });
    }

    const flag = await Flag.create({
      flaggedUserId: order.user._id,
      flaggedBy: req.user.id,
      orderId: order._id,
      reason,
      description: description || 'Customer reported as not receiving the package',
    });

    await incrementFlagCounters(order.user._id, 'buyer');

    res.status(201).json({
      success: true,
      flag,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};