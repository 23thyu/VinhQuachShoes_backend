"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.Brand, {
        foreignKey: "brand_id",
        as: "brand",
      });
      Product.belongsTo(models.Category, {
        foreignKey: "category_id",
        as: "category",
      });
      Product.hasMany(models.OrderDetail, {
        foreignKey: "product_id",
        as: "orderDetails",
      });
      Product.hasMany(models.BannerDetail, {
        foreignKey: "product_id",
        as: "bannerDetails",
      });

      Product.hasMany(models.NewsDetails, {
        foreignKey: "product_id",
        as: "newsDetails",
      });
      Product.hasMany(models.ProductImage, {
        foreignKey: "product_id",
        as: "product_images",
      });
      Product.hasMany(models.CartItem, {
        foreignKey: "product_id",
        as: "cart_items",
      });
      Product.hasMany(models.ProductVariant, {
        foreignKey: "product_id",
        as: "variants",
      });
    }
  }
  Product.init(
    {
      name: DataTypes.STRING,
      image: DataTypes.TEXT,
      price: DataTypes.INTEGER,
      oldprice: DataTypes.INTEGER,
      description: DataTypes.TEXT,
      specification: DataTypes.TEXT,
      buyturn: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      brand_id: DataTypes.INTEGER,
      category_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "products",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Product;
};
