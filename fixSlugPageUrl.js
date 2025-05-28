const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config({ path: "./config.env" });

const Product = require("./models/productModel");

mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

async function fixSlugAndPageUrl() {
  try {
    const products = await Product.find({});
    for (let product of products) {
      let needsUpdate = false;

      if (!product.slug || product.slug.trim() === "") {
        product.slug = slugify(product.title, { lower: true });
        needsUpdate = true;
      }

      if (!product.pageUrl || product.pageUrl.trim() === "") {
        product.pageUrl = `/ProductPages/home%20products/${product.slug}.html`;
        needsUpdate = true;
      }

      if (needsUpdate) {
        
        await Product.updateOne(
          { _id: product._id },
          { $set: { slug: product.slug, pageUrl: product.pageUrl } }
        );
        console.log(`Updated product: ${product.title}`);
      }
    }
    console.log("All products updated!");
  } catch (error) {
    console.error("Error updating products:", error);
  } finally {
    mongoose.connection.close();
  }
}

fixSlugAndPageUrl();
