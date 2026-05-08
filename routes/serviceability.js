const express = require('express');
const {
  checkServiceability,
  checkCartServiceability,
  getSellerZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  updateBuyerLocation,
  getBuyerLocation,
} = require('../controllers/serviceabilityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All serviceability routes require authentication
router.use(protect);

// Buyer location routes
router.post('/location', updateBuyerLocation);
router.get('/location', getBuyerLocation);

// Serviceability check routes
router.get('/check/:sellerId', checkServiceability);
router.post('/check-cart', checkCartServiceability);

// Seller delivery zone routes
router.get('/zones', getSellerZones);
router.post('/zones', createDeliveryZone);
router.put('/zones/:zoneId', updateDeliveryZone);
router.delete('/zones/:zoneId', deleteDeliveryZone);

module.exports = router;
