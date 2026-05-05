const Order = require('../models/Order');

// Mock payment processing endpoint
exports.processMockPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, cardLast4 } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    if (!paymentMethod || !['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be cash or card' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const transactionId = `${paymentMethod}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    order.paymentMethod = paymentMethod;
    order.paymentStatus = paymentMethod === 'card' ? 'completed' : 'pending';
    order.paymentResult = {
      provider: paymentMethod === 'card' ? 'mock_card' : 'cash_on_delivery',
      transactionId,
      cardLast4: paymentMethod === 'card' ? (cardLast4 || null) : null,
      paidAt: paymentMethod === 'card' ? new Date() : null,
    };

    await order.save();

    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
