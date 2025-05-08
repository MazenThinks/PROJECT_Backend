const axios = require("axios");

const translate = async (text) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a translator. Translate the following text to English only without explanation.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const translatedText = response.data.choices[0].message.content.trim();
    return translatedText;
  } catch (error) {
    console.error("Translation Error:", error.message);
    return text; // لو فشل الترجمة، يكمل بالكلمة الأصلية
  }
};

module.exports = { translate };
