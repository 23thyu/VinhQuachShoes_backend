import express from "express";
const router = express.Router();
import UserRole from "./constants/UserRole.js";

import * as BannerController from "./controllers/BannerController";
import * as BannerDetailController from "./controllers/BannerDetailController";

import * as UserController from "./controllers/UserController";
import * as CategoryController from "./controllers/CategoryController";
import * as ProductController from "./controllers/ProductController";
import * as ProductVariantController from "./controllers/ProductVariantController";
import InsertProductVariantRequest from "./dtos/requests/product_variant/InsertProductVariantRequest";
import UpdateProductVariantRequest from "./dtos/requests/product_variant/UpdateProductVariantRequest";
import * as BrandController from "./controllers/BrandController";
import * as OrderController from "./controllers/OrderController";
import * as OrderDetailController from "./controllers/OrderDetailController";
import asyncHandler from "./middlewares/asynHandler";
import validate from "./middlewares/validate";
import InsertProductRequests from "./dtos/requests/product/InsertProductRequests";
import UpdateProductRequest from "./dtos/requests/product/UpdateProductRequests";
import InsertOrderRequest from "./dtos/requests/order/InsertOrderRequest";
import InsertUserRequest from "./dtos/requests/user/InsertUserRequest";
import * as NewsController from "./controllers/NewsController";
import InsertNewsRequest from "./dtos/requests/news/InsertNewsRequest";
import * as NewsDetailController from "./controllers/NewsDetailController";
import InsertNewsDetailRequest from "./dtos/requests/newsdetails/InsertNewsDetailRequests";
import UpdateNewsRequest from "./dtos/requests/news/UpdateNewsRequest";
import InsertBannerRequest from "./dtos/requests/banner/InsertBannerRequest";
import InsertBannerDetailRequest from "./dtos/requests/bannerdetails/InsertBannerDetailRequest.js";
import uploadImageMiddlewares from "./middlewares/imageUpload.js";
import * as ImageController from "./controllers/ImageController";
import * as MediaController from "./controllers/MediaController";
import validateImageExists from "./middlewares/validateImageExists.js";
import uploadGoogleImageMiddleware from "./middlewares/imageGoogleUpload.js";
import uploadCloudinaryImageMiddleware from "./middlewares/imageCloudinaryUpload.js";
import { uploadToCloudinary } from "./config/cloudinaryConfig.js";
import * as ProductImageController from "./controllers/ProductImageController";
import InsertProductImageRequest from "./dtos/requests/product_image/InsertProductImage.js";
import * as CartController from "./controllers/CartController";
import * as CartItemController from "./controllers/CartItemController";
import InsertCartRequest from "./dtos/requests/cart/InsertCartRequests.js";
import InsertCartItemRequest from "./dtos/requests/cart_item/InsertCartItemRequests.js";
import UpdateOrderRequest from "./dtos/requests/order/UpdateOrderRequests.js";
import loginUserRequest from "./dtos/requests/user/LoginUserRequest.js";
import { requireRoles } from "./middlewares/jwtmiddlewares.js";

export function AppRoute(app) {
  //Image
  router.post(
    "/images/upload",
    requireRoles([UserRole.ADMIN]),
    uploadImageMiddlewares.array("images", 5),
    asyncHandler(ImageController.uploadImages)
  );
  router.post(
    "/images/google/upload",
    requireRoles([UserRole.ADMIN]),
    uploadGoogleImageMiddleware.array("images", 5),
    asyncHandler(ImageController.uploadImageGoogle)
  );
  router.post(
    "/images/cloudinary/upload",
    requireRoles([UserRole.ADMIN]),
    uploadCloudinaryImageMiddleware.array("images", 5),
    asyncHandler(ImageController.uploadImageCloudinary)
  );
  router.get("/images/:fileName",
    asyncHandler(ImageController.viewImage));
  router.delete("/images/delete",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(ImageController.deleteImage));

  //Media Library
  router.get(
    "/media",
    asyncHandler(MediaController.getAllMedia)
  );
  router.post(
    "/media/upload",
    uploadCloudinaryImageMiddleware.array("images", 5),
    asyncHandler(MediaController.uploadMedia)
  );
  router.delete(
    "/media/:id",
    asyncHandler(MediaController.deleteMedia)
  );

  //user router
  router.post(
    "/register-users/upload-avatar",
    uploadCloudinaryImageMiddleware.array("images", 1),
    asyncHandler(async (req, res) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Không có file nào được tải lên." });
      }
      const file = req.files[0];
      const result = await uploadToCloudinary(file.buffer, "shopapp/avatars");
      return res.status(200).json({
        message: "Tải ảnh avatar thành công",
        url: result.secure_url,
      });
    })
  );
  router.post(
    "/register-users",
    validate(InsertUserRequest),
    asyncHandler(UserController.registerUser)
  );
  router.post(
    "/login-users",
    validate(loginUserRequest),
    asyncHandler(UserController.loginUser)
  );
  router.post(
    "/users/:id",
    requireRoles([UserRole.USER, UserRole.ADMIN]),
    asyncHandler(UserController.updateUser)
  );
  router.get(
    "/users",
    asyncHandler(UserController.getUsers)
  );
  router.put(
    "/users/:id/admin",
    asyncHandler(UserController.adminUpdateUser)
  );

  //product
  router.get("/products", asyncHandler(ProductController.getProducts));
  router.get("/products/:id", asyncHandler(ProductController.getProductsById));
  router.post(
    "/products",
    requireRoles([UserRole.ADMIN]),
    validateImageExists,
    validate(InsertProductRequests),
    asyncHandler(ProductController.insertProducts)
  );
  router.delete(
    "/products/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(ProductController.deleteProducts)
  );
  router.put(
    "/products/:id",
    requireRoles([UserRole.ADMIN]),
    validateImageExists,
    validate(UpdateProductRequest),
    asyncHandler(ProductController.updateProducts)
  );
  //product variant
  router.get(
    "/products/:productId/variants",
    asyncHandler(ProductVariantController.getVariantsByProductId)
  );
  router.post(
    "/products/:productId/variants/bulk",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(ProductVariantController.bulkSaveVariants)
  );
  router.post(
    "/product-variants",
    requireRoles([UserRole.ADMIN]),
    validate(InsertProductVariantRequest),
    asyncHandler(ProductVariantController.insertProductVariant)
  );
  router.put(
    "/product-variants/:id",
    requireRoles([UserRole.ADMIN]),
    validate(UpdateProductVariantRequest),
    asyncHandler(ProductVariantController.updateProductVariant)
  );
  router.delete(
    "/product-variants/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(ProductVariantController.deleteProductVariant)
  );
  //category
  router.get("/categories", asyncHandler(CategoryController.getCategories));
  router.get(
    "/categories/:id",
    asyncHandler(CategoryController.getCategoryById)
  );
  router.post(
    "/categories",
    validateImageExists,
    requireRoles([UserRole.ADMIN]),
    asyncHandler(CategoryController.insertCategory)
  );
  router.delete(
    "/categories/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(CategoryController.deleteCategory)
  );
  router.put(
    "/categories/:id",
    validateImageExists,
    requireRoles([UserRole.ADMIN]),
    asyncHandler(CategoryController.updateCategory)
  );
  //brand
  router.get("/brands", asyncHandler(BrandController.getBrands));
  router.get("/brands/:id", asyncHandler(BrandController.getBrandById));
  router.post(
    "/brands",
    requireRoles([UserRole.ADMIN]),
    validateImageExists,
    asyncHandler(BrandController.insertBrand)
  );
  router.delete(
    "/brands/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(BrandController.deleteBrand)
  );
  router.put(
    "/brands/:id",
    requireRoles([UserRole.ADMIN]),
    validateImageExists,
    asyncHandler(BrandController.updateBrand)
  );
  //order
  router.get(
    "/orders",
    requireRoles([UserRole.ADMIN, UserRole.USER]),
    asyncHandler(OrderController.getOrders)
  );
  router.get(
    "/orders/:id",
    requireRoles([UserRole.ADMIN, UserRole.USER]),
    asyncHandler(OrderController.getOrderById)
  );
  router.post(
    "/orders",
    requireRoles([UserRole.ADMIN]),
    validate(InsertOrderRequest),
    asyncHandler(OrderController.insertOrder)
  );
  router.delete("/orders/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(OrderController.deleteOrder));
  router.put(
    "/orders/:id",
    requireRoles([UserRole.ADMIN, UserRole.USER]),
    validate(UpdateOrderRequest),
    asyncHandler(OrderController.updateOrder)
  );
  //orderdetail
  router.get(
    "/order-details",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(OrderDetailController.getOrderDetails)
  );
  router.get(
    "/order-details/:id",
    requireRoles([UserRole.ADMIN, UserRole.USER]),
    asyncHandler(OrderDetailController.getOrderDetailById)
  );
  router.post(
    "/order-details",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(OrderDetailController.insertOrderDetail)
  );
  router.delete(
    "/order-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(OrderDetailController.deleteOrderDetail)
  );
  router.put(
    "/order-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(OrderDetailController.updateOrderDetail)
  );
  // Cart Routes
  router.post("/carts/checkout",
    requireRoles([UserRole.USER]),
    asyncHandler(CartController.checkoutCart));
  router.get("/carts",
    asyncHandler(CartController.getCarts));
  router.get(
    "/carts/:id",
    asyncHandler(CartController.getCartById)
  );
  router.post(
    "/carts",
    validate(InsertCartRequest),
    asyncHandler(CartController.insertCart)
  );
  router.delete("/carts/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(CartController.deleteCart));
  router.put(
    "/carts/:id",
    asyncHandler(CartController.updateCart)
  );

  // CartItem Routes
  router.get(
    "/cart-items",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(CartItemController.getCartItems)
  );
  router.get(
    "/cart-items/:id",
    asyncHandler(CartItemController.getCartItemByCartId)
  );
  router.get(
    "/cart-items/carts/:cart_id",
    asyncHandler(CartItemController.getCartItemByCartId)
  );
  router.post(
    "/cart-items",
    validate(InsertCartItemRequest),
    asyncHandler(CartItemController.insertCartItem)
  );
  router.delete(
    "/cart-items/:id",
    asyncHandler(CartItemController.deleteCartItem)
  );
  router.put(
    "/cart-items/:id",
    asyncHandler(CartItemController.updateCartItem)
  );
  //news
  router.get("/news", asyncHandler(NewsController.getNewsArticles));
  router.get("/news/:id", asyncHandler(NewsController.getNewsArticleById));
  router.post(
    "/news",
    validateImageExists,
    validate(InsertNewsRequest),
    asyncHandler(NewsController.insertNewsArticle)
  );
  router.delete("/news/:id",
    asyncHandler(NewsController.deleteNewsArticle));
  router.put(
    "/news/:id",
    validateImageExists,
    validate(UpdateNewsRequest),
    asyncHandler(NewsController.updateNewsArticle)
  );

  //newsdetails
  // NewsDetail Routes
  router.get(
    "/news-details",
    asyncHandler(NewsDetailController.getNewsDetails)
  );
  router.get(
    "/news-details/:id",
    asyncHandler(NewsDetailController.getNewsDetailById)
  );
  router.post(
    "/news-details",
    requireRoles([UserRole.ADMIN]),
    validate(InsertNewsDetailRequest),
    asyncHandler(NewsDetailController.insertNewsDetail)
  );
  router.delete(
    "/news-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(NewsDetailController.deleteNewsDetail)
  );
  router.put(
    "/news-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(NewsDetailController.updateNewsDetail)
  );
  // Test route đơn giản
  router.get("/test-banner", (req, res) => {
    res.json({ message: "Test banner route works!" });
  });

  // Router cho Banner
  router.get("/banners", asyncHandler(BannerController.getBanners));
  router.get("/banners/:id", asyncHandler(BannerController.getBannerById));
  router.post(
    "/banners",
    validate(InsertBannerRequest),
    validateImageExists,
    asyncHandler(BannerController.insertBanner)
  );
  router.delete("/banners/:id",
    asyncHandler(BannerController.deleteBanner));
  router.put(
    "/banners/:id",
    validateImageExists,
    asyncHandler(BannerController.updateBanner)
  );

  // Router cho BannerDetail
  router.get(
    "/banner-details",
    asyncHandler(BannerDetailController.getBannerDetails)
  );
  router.get(
    "/banner-details/:id",
    asyncHandler(BannerDetailController.getBannerDetailById)
  );
  router.post(
    "/banner-details",
    requireRoles([UserRole.ADMIN]),
    validate(InsertBannerDetailRequest),
    asyncHandler(BannerDetailController.insertBannerDetail)
  );
  router.delete(
    "/banner-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(BannerDetailController.deleteBannerDetail)
  );
  router.put(
    "/banner-details/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(BannerDetailController.updateBannerDetail)
  );

  // Product Image Routes
  // Product Image Routes
  router.get(
    "/product-images",
    asyncHandler(ProductImageController.getProductImages)
  );
  router.get(
    "/product-images/:id",
    asyncHandler(ProductImageController.getProductImage)
  ); // Đổi getProductImageById thành getProductImage cho đồng nhất
  router.post(
    "/product-images",
    requireRoles([UserRole.ADMIN]),
    validate(InsertProductImageRequest),
    asyncHandler(ProductImageController.insertProductImage)
  );
  router.delete(
    "/product-images/:id",
    requireRoles([UserRole.ADMIN]),
    asyncHandler(ProductImageController.deleteProductImage)
  );
  // PUT /product-images/:id hiện chưa được hỗ trợ (updateProductImage đang được phát triển)

  app.use("/api/", router);
}
