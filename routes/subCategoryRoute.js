const express = require('express');

const { createSubCategory,
    getSubCategory, 
    getSubCategories,
    updateSubCategory,
    deleteSubCategory,  // DELETE /api/subcategories/:id
    setCategoryIdToBody,
    createFilterObj,
} = require('../services/subCategoryService');
const { 
    createSubCategoryValidator, 
    getSubCategoryValidator, 
    updateSubCategoryValidator,
    deleteSubCategoryValidator,  // DELETE /api/subcategories/:id
} = require('../utils/validators/subCategoryValidator');

const authService = require('../services/authService');


// mergeParams: allow us to access parameters on other routers
// ex: we need to access categoryId from category router
const router = express.Router({ mergeParams: true });

router.route('/')
.post(authService.protect,
    authService.allowedTo('admin', 'manager'),
    setCategoryIdToBody, 
    createSubCategoryValidator, 
    createSubCategory)
.get(createFilterObj, getSubCategories);
router
.route('/:id')
.get(getSubCategoryValidator, getSubCategory)
.put(authService.protect,
    authService.allowedTo('admin', 'manager'),
    updateSubCategoryValidator,
     updateSubCategory)
.delete(authService.protect,
    authService.allowedTo('admin'),deleteSubCategoryValidator, deleteSubCategory);

module.exports = router;