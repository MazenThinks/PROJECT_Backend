// scripts/estimate-embedding-cost.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// تعريف سكيمه بسيطة بدون علاقات
const productSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const Product = mongoose.model('ProductEstimate', productSchema, 'products'); 
// لاحظ: 'products' هنا اسم الكلكشن الحقيقي في الداتابيز

const estimateEmbeddingCost = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find().lean();

    if (products.length === 0) {
      console.log('⚠️ No products found.');
      process.exit();
    }

    let totalTokens = 0;

    for (const product of products) {
      const text = `${product.title || ''} ${product.description || ''}`;
      const tokens = text.split(/\s+/).length;
      totalTokens += tokens;
    }

    const tokenCostUSD = 0.0001; // تكلفة 1000 توكن لــ ada-002

    const estimatedCost = (totalTokens / 1000) * tokenCostUSD;

    console.log('📦 Total Products:', products.length);
    console.log('🔢 Total Tokens:', totalTokens);
    console.log('💲 Estimated Cost (USD):', estimatedCost.toFixed(6));

    process.exit();
  } catch (error) {
    console.error('❌ Error calculating cost:', error.message);
    process.exit(1);
  }
};

estimateEmbeddingCost();
