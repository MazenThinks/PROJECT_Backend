const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/productModel"); // عدّل المسار حسب موقع الموديل عندك

const PRODUCT_PAGES_DIR = path.join(__dirname, "ProductPages"); // مسار مجلد صفحات المنتجات

async function checkProductPages() {
  await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const products = await Product.find();

  let missingFiles = [];

  for (const product of products) {
    // بنفترض إن pageUrl موجودة كـ رابط كامل مثل: "/ProductPages/slug.html"
    // فهنا هنستخرج اسم الملف
    const fileName = product.pageUrl ? path.basename(product.pageUrl) : null;
    if (!fileName) {
      missingFiles.push({ productId: product._id, reason: "No pageUrl" });
      continue;
    }

    const filePath = path.join(PRODUCT_PAGES_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      missingFiles.push({ productId: product._id, slug: product.slug, fileName });
    }
  }

  if (missingFiles.length > 0) {
    console.log("Products with missing HTML files:");
    missingFiles.forEach((item) => {
      console.log(item);
    });
  } else {
    console.log("All product page files exist!");
  }

  mongoose.disconnect();
}

checkProductPages().catch(console.error);
