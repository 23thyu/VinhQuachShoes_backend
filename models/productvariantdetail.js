"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductVariantDetail extends Model {
    static associate(models) {
      ProductVariantDetail.belongsTo(models.ProductVariant, {
        foreignKey: "product_variant_id",
        as: "variant",
      });
    }
  }
  ProductVariantDetail.init(
    {
      product_variant_id: DataTypes.INTEGER,
      attribute_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attribute_value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProductVariantDetail",
      tableName: "product_variants_details",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return ProductVariantDetail;
};
