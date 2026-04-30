const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrder,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id', updateOrder);
router.delete('/:id', cancelOrder);

module.exports = router;
