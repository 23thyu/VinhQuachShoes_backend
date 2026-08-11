"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
      ProductVariant.hasMany(models.CartItem, {
        foreignKey: "product_variant_id",
        as: "cart_items",
      });
      ProductVariant.hasMany(models.OrderDetail, {
        foreignKey: "product_variant_id",
        as: "order_details",
      });
      ProductVariant.hasMany(models.ProductVariantDetail, {
        foreignKey: "product_variant_id",
        as: "details",
      });
    }
  }
  ProductVariant.init(
    {
      product_id: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      image: DataTypes.TEXT,
      attributes: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "ProductVariant",
      tableName: "product_variants",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return ProductVariant;
};
