const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    deliveryTimeEstimate: {
      type: Number,
      default: 1,
    },
    images: {
      type: Array,
      default: [],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Post-save hook to sync product with category
productSchema.post('save', async function (doc) {
  try {
    const Category = mongoose.model('Category');
    // Add product to category if not already there
    await Category.findByIdAndUpdate(
      doc.category,
      { $addToSet: { products: doc._id } },
      { new: true }
    );
  } catch (error) {
    console.error('Error syncing product to category:', error.message);
  }
});

// Post hook for findByIdAndUpdate
productSchema.post('findByIdAndUpdate', async function (doc) {
  try {
    if (doc && doc.category) {
      const Category = mongoose.model('Category');
      await Category.findByIdAndUpdate(
        doc.category,
        { $addToSet: { products: doc._id } },
        { new: true }
      );
    }
  } catch (error) {
    console.error('Error syncing updated product to category:', error.message);
  }
});

module.exports = mongoose.model('Product', productSchema);