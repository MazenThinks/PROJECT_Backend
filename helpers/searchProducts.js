const Product = require("../models/productModel");
const { createEmbedding } = require("./openaiEmbedding");
const { translate } = require("./translate"); // لازم تكون عملت الملف دا

const searchProducts = async (query) => {
  try {
    // أولاً: نترجم الكلمة للإنجليزية
    const translatedQuery = await translate(query);

    // ثانياً: نعمل embedding للجملة المترجمة
    const embedding = await createEmbedding(translatedQuery);

    // ثالثاً: نبحث في الداتا بالـ vector
    const products = await Product.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // اسم المؤشر بتاع الـ vector search اللي انت عامله
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100, // عدد المرشحين المبدئي
          limit: 10, // النتايج النهائية اللي ترجعها
        },
      },
    ]);

    return products;
  } catch (error) {
    console.error("Search Error:", error.message);
    throw new Error("Failed to search products");
  }
};

module.exports = searchProducts;
