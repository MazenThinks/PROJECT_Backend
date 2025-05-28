const express = require("express");
const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/productValidator");

const factory = require("../services/handlersFactory");
const Product = require("../models/productModel");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
} = require("../services/productService");

const authService = require("../services/authService");
const reviewsRoute = require("./reviewRoute");

const { searchProductsAI } = require("../controllers/productController");

const router = express.Router();

//  اول حاجة: Route بتاع البحث بالذكاء الاصطناعي
router.post("/search", searchProductsAI);

//  Sub-Routes: Reviews
router.use("/:productId/reviews", reviewsRoute);

//  CRUD routes
router
  .route("/")
  .get(factory.getAll(Product, "Products"))
  .post(
    authService.protect,
    authService.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    createProductValidator,
    createProduct
  );

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    authService.protect,
    authService.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    updateProductValidator,
    updateProduct
  )
  .delete(
    authService.protect,
    authService.allowedTo("admin"),
    deleteProductValidator,
    deleteProduct
  );

module.exports = router;
