const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

// Get seller profile
router.get('/profile', protect, async (req, res) => {
  try {
    const seller = await User.findById(req.user.id).select('-password');
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller profile', error: error.message });
  }
});

// Update seller profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { phone, address, city, state, zipCode, businessName, serviceArea } = req.body;
    
    const seller = await User.findByIdAndUpdate(
      req.user.id,
      {
        phone,
        address,
        city,
        state,
        zipCode,
        businessName,
        serviceArea,
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get seller's items (placeholder for now)
router.get('/items', protect, async (req, res) => {
  try {
    const items = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

module.exports = router;
