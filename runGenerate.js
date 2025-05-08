const dotenv = require('dotenv');
dotenv.config({ path: 'C:/Users/Abdullah/Desktop/PROJECT_Backend/config.env' });

const mongoose = require('mongoose');
const generateEmbeddingsForProducts = require('./helpers/generateEmbeddings');

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('DB Connected');
    await generateEmbeddingsForProducts();
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('DB Connection Error:', err);
  });
