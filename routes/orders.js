const express = require('express');
const {
  createOrder,
  getUserOrders,
  getSellerOrders,
  getOrder,
  updateOrder,
  cancelOrder,
  addOrderComment,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/buyer/my-orders', getUserOrders);
router.get('/seller/my-orders', getSellerOrders);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.post('/:id/comments', addOrderComment);
router.put('/:id', updateOrder);
router.delete('/:id', cancelOrder);

module.exports = router;
