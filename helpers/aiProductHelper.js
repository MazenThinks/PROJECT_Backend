const axios = require('axios');

const generateProductDescription = async (title) => {
  const prompt = `Write a short, clear, and attractive product description for an e-commerce product called "${title}".`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const description = response.data.choices[0].message.content.trim();
  return description;
};

module.exports = { generateProductDescription };
