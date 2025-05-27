// scripts/fixEmbeddings.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const Product = require("../models/productModel");

dotenv.config({ path: "./config.env" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function fixProductsEmbeddings() {
  try {
    await mongoose.connect(process.env.DB_URI);

    const products = await Product.find({
      $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
    });

    console.log(`Found ${products.length} products without embeddings.`);

    for (const product of products) {
      try {
        // Use both title and description for embedding
        const text = `${product.title || ""} ${product.description || ""}`;
        const embedding = await generateEmbedding(text);
        product.embedding = embedding;
        await product.save();
        console.log(` Updated embedding for: ${product.title}`);
      } catch (err) {
        console.error(` Failed to update ${product.title}:`, err.message);
      }
    }

    console.log("All missing embeddings fixed.");
    process.exit();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixProductsEmbeddings();
