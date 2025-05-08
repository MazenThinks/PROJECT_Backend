const Product = require('../models/productModel');
require('../models/categoryModel');

const OpenAI = require('openai');
require('dotenv').config({ path: './config.env' });

require('../config/database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const addEmbeddingsToProducts = async () => {
  try {
    console.log(' Starting the embedding process...');

    const products = await Product.find({ embedding: { $exists: false } });

    if (products.length === 0) {
      console.log(' No products need embedding.');
      return;
    }

    console.log(`Found ${products.length} products.`);

    const bulkOperations = [];

    for (const product of products) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: product.title,
      });

      if (response.data && response.data[0] && response.data[0].embedding) {
        const embedding = response.data[0].embedding;

        bulkOperations.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { embedding } },
          },
        });

        console.log(` Prepared embedding for: ${product.title}`);
      } else {
        console.error(` Failed to get embedding for: ${product.title}`);
      }
    }

    if (bulkOperations.length > 0) {
      await Product.bulkWrite(bulkOperations);
      console.log(' All products updated successfully with embeddings!');
    } else {
      console.log(' No embeddings were generated.');
    }
  } catch (err) {
    console.error(' Error during embedding:', err);
  }
};

if (require.main === module) {
  addEmbeddingsToProducts();
}

module.exports = addEmbeddingsToProducts;
