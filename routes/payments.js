const express = require('express');
const router = express.Router();
const { processMockPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// POST /api/payments/pay
router.post('/pay', protect, processMockPayment);

module.exports = router;
