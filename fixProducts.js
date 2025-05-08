const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load config.env
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Database connected');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Load all models
const loadModels = require('./loadModels');
loadModels(path.join(__dirname, 'models'));

// Now we can use models
const Product = mongoose.model('Product');

const fixProducts = async () => {
  try {
    const products = await Product.find({});

    for (const product of products) {
      let modified = false;

      // 1- Fix category field (if populated wrong)
      if (product.category && typeof product.category !== 'object') {
        product.category = undefined;
        modified = true;
        console.log(`✅ Fixed category for product: ${product._id}`);
      }

      // 2- Fix brand field (if it's a string, not ObjectId)
      if (product.brand && typeof product.brand === 'string') {
        product.brand = undefined;
        modified = true;
        console.log(`✅ Fixed brand for product: ${product._id}`);
      }

      // 3- Shorten title if too long
      if (product.title && product.title.length > 100) {
        product.title = product.title.substring(0, 100);
        modified = true;
        console.log(`✅ Shortened title for product: ${product._id}`);
      }

      if (modified) {
        await product.save();
      }
    }

    console.log('🎯 All products fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error while fixing products:', err);
    process.exit(1);
  }
};

connectDB().then(fixProducts);
