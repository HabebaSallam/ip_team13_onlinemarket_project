const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get buyer profile
router.get('/profile', protect, async (req, res) => {
  try {
    const buyer = await User.findById(req.user.id).select('-password');
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyer profile', error: error.message });
  }
});

// Update buyer profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { phone, address, city, state, zipCode } = req.body;
    
    const buyer = await User.findByIdAndUpdate(
      req.user.id,
      {
        phone,
        address,
        city,
        state,
        zipCode,
      },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      buyer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
