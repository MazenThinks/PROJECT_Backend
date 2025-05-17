const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Import the Category model
const Category = require('../models/categoryModel');

// Connect to MongoDB
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define categories to create
const categories = [
  {
    name: 'Appliances',
    slug: 'appliances',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
  },
  {
    name: 'Home',
    slug: 'home',
  }
];

// Function to create categories
const createCategories = async () => {
  try {
    // Delete existing categories
    await Category.deleteMany({});
    console.log('Deleted existing categories');

    // Create new categories
    const createdCategories = await Category.create(categories);
    console.log('Created categories:', createdCategories);

    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating categories:', error);
    process.exit(1);
  }
};

// Run the script
createCategories(); 