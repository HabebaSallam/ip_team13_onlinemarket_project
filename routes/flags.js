const express = require('express');
const { protect } = require('../middleware/auth');
const { createFlag, getMyFlags, flagBuyerForOrder } = require('../controllers/flagController');

const router = express.Router();

router.post('/', protect, createFlag);
router.post('/orders/:orderId', protect, flagBuyerForOrder);
router.get('/my-flags', protect, getMyFlags);

module.exports = router;