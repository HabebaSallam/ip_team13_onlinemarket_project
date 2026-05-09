const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['buyer', 'seller'],
      default: 'buyer',
    },
    role: {
      type: String,
      enum: ['customer', 'seller'],
      default: 'customer',
    },
    phone: String,
    businessName: String,
    serviceArea: String,
    rating: {
      type: Number,
      default: 0,
    },
    flags: {
      type: Number,
      default: 0,
    },
    buyerFlags: {
      type: Number,
      default: 0,
    },
    sellerFlags: {
      type: Number,
      default: 0,
    },
    addresses: [{
      _id: mongoose.Schema.Types.ObjectId,
      recipientName: String,
      phone: String,
      street: String,
      apartment: String,
      city: String,
      state: String,
      zipCode: String,
      landmark: String,
      notes: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
