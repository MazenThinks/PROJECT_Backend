require('dotenv').config();
const mongoose = require('mongoose');

// تسجيل موديلات فاضية عشان الـ refs
mongoose.model('Category', new mongoose.Schema({ name: String }));
mongoose.model('SubCategory', new mongoose.Schema({ name: String }));
mongoose.model('Brand', new mongoose.Schema({ name: String }));

const Product = require('../models/productModel');

const checkProductsData = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find();

    let issuesFound = false;

    for (const product of products) {
      const problems = [];

      if (!product.title || product.title.length > 100) problems.push('Invalid or missing title');
      if (!product.slug) problems.push('Missing slug');
      if (!product.description || product.description.length < 20) problems.push('Missing or short description');
      if (!product.imageCover) problems.push('Missing imageCover');
      if (!product.category || typeof product.category !== 'object') problems.push('Missing or invalid category');
      if (product.brand && typeof product.brand !== 'object') problems.push('Invalid brand');

      if (problems.length > 0) {
        issuesFound = true;
        console.log(`❌ [${product._id}] ${product.title || 'No Title'}:`);
        problems.forEach(p => console.log(`   - ${p}`));
      } else {
        console.log(`✅ [${product._id}] ${product.title}`);
      }
    }

    if (!issuesFound) {
      console.log('🎉 All products are valid!');
    } else {
      console.log('⚠️ Some products have issues, please fix them.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

checkProductsData();
