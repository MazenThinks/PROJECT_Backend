const factory = require('./handlersFactory');
const Review = require('../models/reviewModel');




// Nested route
// GET /api/v1/products/:productId/reviews
exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
if (req.params.productId) filterObject = { product: req.params.productId};
req.filterObj = filterObject;
next();
};

//@desc   Get list of reviews
//@route  GET /api/v1/reviews
//@access Public
exports.getReviews = factory.getAll(Review);

//@desc  Get specific review by if
//@route GET /api/v1/reviews/:id
//@access Public
exports.getReview = factory.getOne(Review);



exports.setProductIdAndUserIdToBody = (req, res, next) => {
    // Nested route(create)
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};
//@desc   Create review
//@route  POST  /api/v1/reviews
//@access Private/Protect/User
exports.createReview = factory.createOne(Review);


//@desc    Update spacific review
//@route   Put  /api/v1/reviews/:id
//@access  Private/Protect/User
exports.updateReview = factory.updateOne(Review);


//@desc    Delete spacific review
//@route   DELETE  /api/v1/reviews/:id
//@access  Private/Protect/User-Admin-Manager
exports.deleteReview= factory.deleteOne(Review);
