const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.getSubCategoryValidator = [
   check('id').isMongoId().withMessage('Invalid Subcategory id format'),
    validatorMiddleware,
];


exports.createSubCategoryValidator = [
    check('name')
    .notEmpty()
    .withMessage('subCategory required')
    .isLength({ min: 2})
    .withMessage('Too short subcategory name')
    .isLength({ max: 32})
    .withMessage('Too long subcategory name')
    .custom((val, { req }) => {
        req.body.slug = slugify (val); 
        return true;
     }),
    check('category').notEmpty().withMessage("subCategory must be belong to a category")
    .isMongoId().withMessage('Invalid subCategory id format'),

    validatorMiddleware,
];

exports.updateSubCategoryValidator = [
    check('id').isMongoId().withMessage('Invalid subcategory id format'),
    body('name').custom((val, { req }) => {
        req.body.slug = slugify(val);
        return true;
    }),
    validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
    check('id').isMongoId().withMessage('Invalid subCategory id format'),
    validatorMiddleware,
];