const express = require('express');


const {
    getCategoryValidator, 
    createCategoryValidator, 
    UpdateCategoryValidator, 
    deleteCategoryValidator
} 
    = require("../utils/validators/categoryValidator");

const { 
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    resizeImage,
    } = require('../services/categoryService');

const authService = require('../services/authService');

const subcategoriesRoute = require('./subCategoryRoute');

const router = express.Router();

// nested route
router.use('/:categoryId/subcategories', subcategoriesRoute);

router
.route('/')
.get(getCategories)

.post(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    uploadCategoryImage, 
    resizeImage,
    createCategoryValidator, 
    createCategory
);

router
.route('/:id')
.get(getCategoryValidator, getCategory)
.put(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    uploadCategoryImage, 
    resizeImage, 
    UpdateCategoryValidator, 
    updateCategory
)

.delete( authService.protect,
    authService.allowedTo('admin'),
    deleteCategoryValidator, 
    deleteCategory);

module.exports = router;  