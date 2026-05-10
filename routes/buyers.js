const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const BuyerLocation = require('../models/BuyerLocation');

const router = express.Router();

// Get buyer profile
router.get('/profile', protect, async (req, res) => {
  try {
    const buyer = await User.findById(req.user.id).select('-password');
    const detectedLocation = await BuyerLocation.findOne({ buyerId: req.user.id });

    res.json({
      ...buyer.toObject(),
      detectedLocation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyer profile', error: error.message });
  }
});

// Update buyer profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { phone } = req.body;
    const updateData = {};

    if (phone !== undefined) {
      updateData.phone = phone;
    }
    
    const buyer = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
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

// Get buyer addresses
router.get('/addresses', protect, async (req, res) => {
  try {
    const buyer = await User.findById(req.user.id).select('addresses');
    res.json({
      addresses: buyer.addresses || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
});

// Add address to buyer profile
router.post('/addresses', protect, async (req, res) => {
  try {
    const { recipientName, phone, street, apartment, city, state, zipCode, landmark, notes, isDefault } = req.body;

    const addressData = {
      _id: new mongoose.Types.ObjectId(),
      recipientName,
      phone,
      street,
      apartment,
      city,
      state,
      zipCode,
      landmark,
      notes,
      isDefault: isDefault || false,
      createdAt: new Date(),
    };

    // If setting as default, unset all others
    if (addressData.isDefault) {
      await User.updateOne(
        { _id: req.user.id },
        { $set: { 'addresses.$[].isDefault': false } }
      );
    }

    const buyer = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { addresses: addressData } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Address added successfully',
      address: addressData,
      buyer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
});

// Update address
router.put('/addresses/:addressId', protect, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { recipientName, phone, street, apartment, city, state, zipCode, landmark, notes, isDefault } = req.body;

    // If setting as default, unset all others
    if (isDefault) {
      await User.updateOne(
        { _id: req.user.id },
        { $set: { 'addresses.$[].isDefault': false } }
      );
    }

    const buyer = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'addresses.$[addr].recipientName': recipientName,
          'addresses.$[addr].phone': phone,
          'addresses.$[addr].street': street,
          'addresses.$[addr].apartment': apartment,
          'addresses.$[addr].city': city,
          'addresses.$[addr].state': state,
          'addresses.$[addr].zipCode': zipCode,
          'addresses.$[addr].landmark': landmark,
          'addresses.$[addr].notes': notes,
          'addresses.$[addr].isDefault': isDefault || false,
        },
      },
      {
        arrayFilters: [{ 'addr._id': addressId }],
        new: true,
      }
    ).select('-password');

    res.json({
      message: 'Address updated successfully',
      buyer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
});

// Delete address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const { addressId } = req.params;

    const buyer = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Address deleted successfully',
      buyer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

module.exports = router;