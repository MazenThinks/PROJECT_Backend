// controllers/productController.js

const Product = require("../models/productModel");
const OpenAI = require("openai");
require("dotenv").config({ path: "./config.env" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Search Controller
exports.searchProductsAI = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "You must provide a search query." });
    }

    // First, try using AI search
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // Load products with embeddings
    let products = await Product.find({
      embedding: { $exists: true, $ne: [] },
    });

    // If no products with embeddings exist, fallback to regex search
    if (products.length === 0) {
      const regex = new RegExp(query, "i");

      const fallbackResults = await Product.find({
        $or: [
          { title: { $regex: regex } },
          { name: { $regex: regex } },
          { description: { $regex: regex } },
        ],
      });

      return res.json({
        results: fallbackResults.length,
        products: fallbackResults,
      });
    }

    // Cosine similarity
    const cosineSimilarity = (vecA, vecB) => {
      const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
      const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
      const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    const scoredProducts = products.map((product) => {
      const score = cosineSimilarity(queryEmbedding, product.embedding);
      return {
        product,
        score,
      };
    });

    scoredProducts.sort((a, b) => b.score - a.score);

    const topProducts = scoredProducts.slice(0, 10).map((item) => ({
      ...item.product.toObject(),
      _score: item.score,
    }));

    res.json({
      results: topProducts.length,
      products: topProducts,
    });
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ message: "Something went wrong during AI search." });
  }
};
