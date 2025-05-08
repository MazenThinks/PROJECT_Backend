require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');

// تسجيل موديلات فاضية عشان الـ refs
mongoose.model('Category', new mongoose.Schema({ name: String }));
mongoose.model('SubCategory', new mongoose.Schema({ name: String }));
mongoose.model('Brand', new mongoose.Schema({ name: String }));

const Product = require('../models/productModel');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
};

const updateProductsEmbedding = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    const batchSize = 50;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await Product.find({})
        .skip(skip)
        .limit(batchSize);

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of products) {
        try {
          const fullText = `${product.title} ${product.description || ""}`;
          const embedding = await generateEmbedding(fullText);

          if (embedding) {
            product.embedding = embedding;
            await product.save();
            console.log(`✅ Saved embedding for: ${product.title}`);
          } else {
            console.warn(`⚠️ Failed embedding for: ${product.title}`);
          }
        } catch (err) {
          console.warn(`⚠️ Skipping product ${product.title || 'Unknown Title'} due to error: ${err.message}`);
        }
      }

      skip += batchSize;
    }

    console.log('🎯 All embeddings generated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

updateProductsEmbedding();
