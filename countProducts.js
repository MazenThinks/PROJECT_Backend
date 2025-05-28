const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const Product = require("./models/productModel");

const run = async () => {
  await mongoose.connect(process.env.DB_URI);
  const products = await Product.find();
  console.log(`📦 Total products in DB: ${products.length}`);
  process.exit();
};

run();
