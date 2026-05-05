const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema(
  {
    flaggedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Flag', flagSchema);