const mongoose = require('mongoose');
const OpenAI = require('openai');
require('dotenv').config({ path: './config.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Too short product title'],
      maxlength: [100, 'Too long product title'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [20, 'Too short product description'],
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      trim: true,
      max: [200000, 'Too long product price'],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: [String],
    imageCover: {
      type: String,
      required: [true, 'Product Image cover is required'],
    },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to category'],
    },
    subcategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory',
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: 'Brand',
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above or equal 1.0'],
      max: [5, 'Rating must be below or equal 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

// Auto populate category field
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name -_id',
  });
  next();
});

// Set image URLs
const setImageURL = (doc) => {
  if (doc.imageCover && !doc.imageCover.startsWith('http')) {
    doc.imageCover = `${process.env.BASE_URL}/products/${doc.imageCover}`;
  }
  if (doc.images && doc.images.length > 0) {
    doc.images = doc.images.map((img) => 
      img.startsWith('http') ? img : `${process.env.BASE_URL}/products/${img}`
    );
  }
};

productSchema.post('init', (doc) => {
  setImageURL(doc);
});
productSchema.post('save', (doc) => {
  setImageURL(doc);
});

// Auto generate embedding before saving
productSchema.pre('save', async function (next) {
  try {
    if ((!this.embedding || this.embedding.length === 0) && this.title) {
      const fullText = `${this.title} ${this.description || ""}`;

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002', // استخدام موديل منخفض التكلفة
        input: fullText,
      });

      if (response.data && response.data[0] && response.data[0].embedding) {
        this.embedding = response.data[0].embedding;
        console.log(`✅ Embedding created for: ${this.title}`);
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error creating embedding:', error.message);
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema);
