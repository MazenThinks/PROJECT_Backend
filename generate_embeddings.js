const mongoose = require("mongoose");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const Product = require("./models/productModel");

// Load env variables
dotenv.config({ path: "./config.env" });

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to DB
mongoose.connect(process.env.DB_URI)
  .then(() => {
    console.log(" DB connected");
    startEmbedding();
  })
  .catch(err => {
    console.error(" DB connection error:", err);
  });

// Start embedding process
async function startEmbedding() {
  try {
    const products = await Product.find({ embedding: { $exists: false } });

    for (const product of products) {
      const text = `${product.title} ${product.description || ""}`;

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      const embedding = embeddingResponse.data[0].embedding;

      await Product.updateOne({ _id: product._id }, { $set: { embedding } });

      console.log(` Embedded: ${product.title}`);
    }

    console.log(" All products processed.");
    process.exit();
  } catch (err) {
    console.error(" Error embedding products:", err);
    process.exit(1);
  }
}