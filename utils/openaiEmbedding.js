const OpenAI = require("openai");

// أنشئ نسخة من مكتبة OpenAI باستخدام مفتاح الـ API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// دالة لتوليد embedding للنص
async function generateEmbedding(text) {
  if (!text) return [];

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // موديل سريع ورخيص
      input: text,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    console.error("Embedding Generation Error:", error.message);
    return [];
  }
}

module.exports = generateEmbedding;
