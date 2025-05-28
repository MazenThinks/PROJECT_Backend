const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const Product = require("../models/productModel");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a smart AI that converts Arabic or Egyptian dialect sentences into simple, short English product keywords for search. Output only keywords or short phrases. No explanation." },
        { role: "user", content: text }
      ]
    });

    const raw = gptResponse.choices[0].message.content;
    const simplifiedText = raw.match(/(?:search term|keyword)[:\-]?\s*(.*)/i)?.[1]?.trim() || raw;
    console.log("Simplified input (cleaned):", simplifiedText);


    console.log("Simplified input:", simplifiedText);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: simplifiedText,
    });

    const userEmbedding = embeddingResponse.data[0].embedding;
    const products = await Product.find({ embedding: { $exists: true } });

    const productsWithScores = products.map((product) => {
      const similarity = cosineSimilarity(userEmbedding, product.embedding);
      return { product, score: similarity };
    });

const threshold = 0.4;
const topResults = productsWithScores
  .filter((item) => item.score >= threshold)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map((item) => ({
    title: item.product.title,
    price: item.product.price,
    slug: item.product.slug,
    pageUrl: item.product.pageUrl
  }));

console.log("Top results:", topResults);
res.json({ results: topResults });

  } catch (error) {
    console.error("Error in voice search:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;