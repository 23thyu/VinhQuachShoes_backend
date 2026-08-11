"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductImage.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }
  ProductImage.init(
    {
      product_id: DataTypes.INTEGER,
      image_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt"
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt"
      }
    },
    {
      sequelize,
      modelName: "ProductImage",
      tableName: "product_images",
      underscored: true,
    }
  );
  return ProductImage;
};
