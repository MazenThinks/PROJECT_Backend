
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./productModel');
const { OpenAI } = require('openai');

dotenv.config(); // Load .env file

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MONGO_URI = 'mongodb://127.0.0.1:27017/ecommerce'; // لو مختلف عندك بلغني

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ Mongo Error:', err));

const generateProductEmbeddings = async () => {
  try {
    const products = await Product.find();

    for (const product of products) {
      const inputText = `${product.title} ${product.description}`;

      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: inputText,
      });

      const embedding = embeddingRes.data[0].embedding;

      product.embedding = embedding;
      await product.save();
    }

    console.log('✅ Embeddings generated and saved successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error generating embeddings:', err.message);
    process.exit(1);
  }
};

generateProductEmbeddings();
