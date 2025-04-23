
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');


const factory = require('./handlersFactory');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const Category = require('../models/categoryModel');


// upload single image
exports.uploadCategoryImage = uploadSingleImage("image");

// image processing 
exports.resizeImage = asyncHandler ( async (req, res, next) => {
const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

if (req.file) {
    await sharp(req.file.buffer)
.resize(600, 600)
.toFormat("jpeg")
.jpeg({ quality: 95 })
.toFile(`uploads/categories/${filename}`);

// save image into our db
req.body.image = filename;
}

next();
});


//@desc   Get list of categories
//@route  GET /api/v1/categories
//@access Public
exports.getCategories = factory.getAll(Category);

//@desc  Get specific category by if
//@route GET /api/v1/categories/:id
//@access Public
exports.getCategory = factory.getOne(Category);


//@desc   Create category
//@route  POST  /api/v1/categories
//@access Private

exports.createCategory = factory.createOne(Category);

//@desc    Update spacific category
//@route   Put  /api/v1/categories/:id
//@access  Private
exports.updateCategory = factory.updateOne(Category);

//@desc   Delete spacific category
//@route   Delete /api/v1/categories/:id
//@access  Private
exports.deleteCategory = factory.deleteOne(Category);
