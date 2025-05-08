const mongoose = require('mongoose');
const OpenAI = require('openai');
require('dotenv').config({ path: './config.env' });

// Import your models
require('../models/categoryModel');
const Product = require('../models/productModel');
require('../config/database'); // Connect to DB directly

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const addEmbeddingsBulk = async () => {
  try {
    console.log(' Starting Bulk Embedding Process...');

    const products = await Product.find({ embedding: { $exists: false } });

    if (products.length === 0) {
      console.log(' All products already have embeddings.');
      return;
    }

    const titles = products.map((product) => product.title);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: titles,
    });

    if (!response.data || response.data.length !== products.length) {
      throw new Error('Embedding response mismatch with products');
    }

    const bulkOperations = products.map((product, index) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { embedding: response.data[index].embedding },
      },
    }));

    await Product.bulkWrite(bulkOperations);

    console.log(` Bulk embedding completed for ${products.length} products`);
    process.exit(0); // Exit cleanly
  } catch (error) {
    console.error(' Error during bulk embedding:', error);
    process.exit(1); // Exit with error
  }
};

addEmbeddingsBulk();
