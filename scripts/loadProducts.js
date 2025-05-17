const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Import models
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Product = require('../models/productModel');

// Connect to MongoDB
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to create categories
const createCategories = async () => {
  try {
    // Delete existing categories
    await Category.deleteMany({});
    console.log('Deleted existing categories');

    // Create categories
    const categories = [
      { name: 'Appliances', slug: 'appliances' },
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Fashion', slug: 'fashion' },
      { name: 'Beauty', slug: 'beauty' },
      { name: 'Home', slug: 'home' }
    ];

    const createdCategories = await Category.create(categories);
    console.log('Created categories:', createdCategories);
    return createdCategories;
  } catch (error) {
    console.error('Error creating categories:', error);
    throw error;
  }
};

// Function to create brands
const createBrands = async (products) => {
  try {
    // Delete existing brands
    await Brand.deleteMany({});
    console.log('Deleted existing brands');

    // Get unique brands from products
    const uniqueBrands = [...new Set(products.map(p => p.brand))];
    
    // Create brands
    const brands = uniqueBrands.map(name => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }));

    const createdBrands = await Brand.create(brands);
    console.log('Created brands:', createdBrands);
    return createdBrands;
  } catch (error) {
    console.error('Error creating brands:', error);
    throw error;
  }
};

// Function to load products
const loadProducts = async () => {
  try {
    // First create categories
    const categories = await createCategories();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Read and process each products file
    const productsDir = path.join(__dirname, '../Products');
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(productsDir, file);
      const productsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Create brands for these products
      const brands = await createBrands(productsData);
      const brandMap = {};
      brands.forEach(brand => {
        brandMap[brand.name] = brand._id;
      });

      // Delete existing products
      await Product.deleteMany({});
      console.log('Deleted existing products');

      // Transform products to match schema
      const products = productsData.map(product => {
        let title = product.title;
        if (title.length > 100) {
          title = title.slice(0, 97) + '...';
        }
        return {
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `${title} - ${product.brand} brand product.`,
          price: product.price,
          category: categoryMap[product.category],
          brand: brandMap[product.brand],
          quantity: 100,
          sold: 0,
          imageCover: 'default-product.jpg',
          images: ['default-product.jpg'],
          ratingsAverage: 4.5,
          ratingsQuantity: 0
        };
      });

      // Create products
      const createdProducts = await Product.create(products);
      console.log(`Created ${createdProducts.length} products from ${file}`);
    }

    console.log('All products loaded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error loading products:', error);
    process.exit(1);
  }
};

// Run the script
loadProducts(); 