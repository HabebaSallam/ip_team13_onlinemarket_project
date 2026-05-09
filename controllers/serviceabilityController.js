const DeliveryZone = require('../models/DeliveryZone');
const BuyerLocation = require('../models/BuyerLocation');
const Product = require('../models/Product');
const User = require('../models/User');

// Calculate distance between two coordinates using Haversine formula (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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

// @desc    Check if buyer is within seller's delivery zone
// @route   GET /api/serviceability/check/:sellerId
exports.checkServiceability = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.user.id;

    // Get buyer location
    const buyerLocation = await BuyerLocation.findOne({ buyerId });
    if (!buyerLocation) {
      return res.status(400).json({
        success: false,
        error: 'Buyer location not found. Please enable location services.',
      });
    }

    // Get seller's delivery zones
    const zones = await DeliveryZone.find({ sellerId, isActive: true });

    if (zones.length === 0) {
      return res.status(200).json({
        success: true,
        isServiceable: true,
        message: 'Seller has no delivery zones set',
      });
    }

    // Check if buyer is within any zone
    let isServiceable = false;
    let nearestZone = null;
    let nearestDistance = Infinity;

    for (const zone of zones) {
      const distance = calculateDistance(
        buyerLocation.latitude,
        buyerLocation.longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radius) {
        isServiceable = true;
        break;
      }

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestZone = zone;
      }
    }

    res.status(200).json({
      success: true,
      isServiceable,
      buyerLocation: {
        latitude: buyerLocation.latitude,
        longitude: buyerLocation.longitude,
        address: buyerLocation.address,
      },
      nearestZone: isServiceable
        ? null
        : {
            name: nearestZone?.name,
            distance: Math.round(nearestDistance * 10) / 10,
          },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Check serviceability for cart items
// @route   POST /api/serviceability/check-cart
exports.checkCartServiceability = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { cartItems } = req.body; // Array of { productId, quantity }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No cart items provided',
      });
    }

    // Get buyer location
    const buyerLocation = await BuyerLocation.findOne({ buyerId });
    if (!buyerLocation) {
      return res.status(400).json({
        success: false,
        error: 'Buyer location not found. Please enable location services.',
      });
    }

    // Get all products
    const products = await Product.find({
      _id: { $in: cartItems.map((item) => item.productId) },
    }).select('sellerId name');

    // Group by seller
    const sellerProducts = {};
    products.forEach((product) => {
      const sellerId = product.sellerId.toString();
      if (!sellerProducts[sellerId]) {
        sellerProducts[sellerId] = [];
      }
      sellerProducts[sellerId].push(product);
    });

    // Check serviceability for each seller
    const serviceabilityStatus = {};
    let allServiceable = true;

    for (const [sellerId, sellerProds] of Object.entries(sellerProducts)) {
      const zones = await DeliveryZone.find({ sellerId, isActive: true });

      let isServiceable = true;
      if (zones.length > 0) {
        isServiceable = zones.some((zone) => {
          const distance = calculateDistance(
            buyerLocation.latitude,
            buyerLocation.longitude,
            zone.latitude,
            zone.longitude
          );
          return distance <= zone.radius;
        });
      }

      serviceabilityStatus[sellerId] = {
        isServiceable,
        products: sellerProds.map((p) => ({ _id: p._id, name: p.name })),
      };

      if (!isServiceable) {
        allServiceable = false;
      }
    }

    res.status(200).json({
      success: true,
      allServiceable,
      serviceabilityStatus,
      buyerLocation: {
        latitude: buyerLocation.latitude,
        longitude: buyerLocation.longitude,
        address: buyerLocation.address,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get seller's delivery zones
// @route   GET /api/serviceability/zones
exports.getSellerZones = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const zones = await DeliveryZone.find({ sellerId });

    res.status(200).json({
      success: true,
      zones,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create delivery zone
// @route   POST /api/serviceability/zones
exports.createDeliveryZone = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { name, latitude, longitude, radius, city, state } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, latitude, and longitude are required',
      });
    }

    const zone = await DeliveryZone.create({
      sellerId,
      name,
      latitude,
      longitude,
      radius: radius || 5,
      city,
      state,
    });

    res.status(201).json({
      success: true,
      zone,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update delivery zone
// @route   PUT /api/serviceability/zones/:zoneId
exports.updateDeliveryZone = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { zoneId } = req.params;
    const { name, latitude, longitude, radius, city, state, isActive } = req.body;

    const zone = await DeliveryZone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found' });
    }

    if (zone.sellerId.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this zone',
      });
    }

    zone.name = name || zone.name;
    zone.latitude = latitude !== undefined ? latitude : zone.latitude;
    zone.longitude = longitude !== undefined ? longitude : zone.longitude;
    zone.radius = radius || zone.radius;
    zone.city = city || zone.city;
    zone.state = state || zone.state;
    zone.isActive = isActive !== undefined ? isActive : zone.isActive;

    await zone.save();

    res.status(200).json({
      success: true,
      zone,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete delivery zone
// @route   DELETE /api/serviceability/zones/:zoneId
exports.deleteDeliveryZone = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { zoneId } = req.params;

    const zone = await DeliveryZone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found' });
    }

    if (zone.sellerId.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this zone',
      });
    }

    await DeliveryZone.deleteOne({ _id: zoneId });

    res.status(200).json({
      success: true,
      message: 'Zone deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update buyer location
// @route   POST /api/serviceability/location
exports.updateBuyerLocation = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { latitude, longitude, address, city, state, zipCode, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    let location = await BuyerLocation.findOne({ buyerId });

    if (!location) {
      location = await BuyerLocation.create({
        buyerId,
        latitude,
        longitude,
        address,
        city,
        state,
        zipCode,
        accuracy,
      });
    } else {
      location.latitude = latitude;
      location.longitude = longitude;
      location.address = address || location.address;
      location.city = city || location.city;
      location.state = state || location.state;
      location.zipCode = zipCode || location.zipCode;
      location.accuracy = accuracy || location.accuracy;
      await location.save();
    }

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get buyer location
// @route   GET /api/serviceability/location
exports.getBuyerLocation = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const location = await BuyerLocation.findOne({ buyerId });

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
