// controllers/productController.js

const Product = require("../models/productModel");
const OpenAI = require("openai");
require("dotenv").config({ path: "./config.env" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Search Controller
const { translate } = require("../helpers/translate");

exports.searchProductsAI = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "You must provide a search query." });
    }

    // ترجم نص البحث للعربية إلى إنجليزية
    const translatedQuery = await translate(query);
    console.log("Translated Query:", translatedQuery);

    // إنشاء embedding على النص المترجم
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: translatedQuery,
    });

    const queryEmbedding = response.data[0].embedding;

    // باقي الكود كما هو:
    let products = await Product.find({
      embedding: { $exists: true, $ne: [] },
    });

    if (products.length === 0) {
  const originalRegex = new RegExp(query, "i");
  const translatedRegex = new RegExp(translatedQuery, "i");

      const fallbackResults = await Product.find({
        $or: [
          { title: { $regex: originalRegex } },
          { name: { $regex: originalRegex } },
          { description: { $regex: originalRegex } },
          { title: { $regex: translatedRegex } },
          { name: { $regex: translatedRegex } },
          { description: { $regex: translatedRegex } },
        ],
      }).collation({ locale: "ar", strength: 1 });

      return res.json({
        results: fallbackResults.length,
        products: fallbackResults,
      });
    }

    // حساب التشابه
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
