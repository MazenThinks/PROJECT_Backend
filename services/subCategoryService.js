const factory = require('./handlersFactory');


const SubCategory = require('../models/subCategoryModel');

exports.setCategoryIdToBody = (req, res, next) => {
    // Nested route
    if (!req.body.category) req.body.category = req.params.categoryId;
    next();
};
//@desc   Create subCategory
//@route  POST  /api/v1/subCategories
//@access Private

exports.createSubCategory = factory.createOne(SubCategory);


// Nested route
// GET /api/v1/categories/:categoryId/subCategories
exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
if (req.params.categoryId) filterObject = { category: req.params.categoryId};
req.filterObj = filterObject;
next();
};

//@desc   Get list of subcategories
//@route  GET /api/v1/subcategories
//@access Public
exports.getSubCategories = factory.getAll(SubCategory);
    
    //@desc  Get specific subcategory by if
    //@route GET /api/v1/subcategories/:id
    //@access Public
exports.getSubCategory = factory.getOne(SubCategory);

    //@desc    Update spacific subcategory
//@route   Put  /api/v1/subcategories/:id
//@access  Private
exports.updateSubCategory = factory.updateOne(SubCategory);

    
    //@desc   Delete spacific subcategory
    //@route   Delete /api/v1/subcategories/:id
    //@access  Private
exports.deleteSubCategory = factory.deleteOne(SubCategory);