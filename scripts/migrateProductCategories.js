const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Category = require('../models/Category');

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_market';
  await mongoose.connect(mongoUri);
}

async function migrateProductCategories({ dryRun = false } = {}) {
  const products = await Product.find({ category: { $type: 'string' } }).lean();
  const summary = {
    scanned: products.length,
    updated: 0,
    createdCategories: 0,
    missingCategories: [],
  };

  for (const product of products) {
    const categoryName = String(product.category || '').trim();
    if (!categoryName) {
      summary.missingCategories.push({ productId: product._id.toString(), reason: 'empty category value' });
      continue;
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      if (dryRun) {
        summary.missingCategories.push({ productId: product._id.toString(), categoryName, reason: 'category would be created' });
        continue;
      }

      category = await Category.create({ name: categoryName });
      summary.createdCategories += 1;
    }

    if (!dryRun) {
      await Product.updateOne({ _id: product._id }, { $set: { category: category._id } });
    }

    summary.updated += 1;
  }

  return summary;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  try {
    await connectDatabase();
    const summary = await migrateProductCategories({ dryRun });

    console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateProductCategories };
