const mongoose = require('mongoose');

const buyerLocationSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    accuracy: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('BuyerLocation', buyerLocationSchema);
