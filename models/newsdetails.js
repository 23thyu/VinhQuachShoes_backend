"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class NewsDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      NewsDetails.belongsTo(models.News, {
        foreignKey: "news_id",
        as: "news",
      });
      NewsDetails.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }
  NewsDetails.init(
    {
      news_id: DataTypes.INTEGER,
      product_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "NewsDetails",
      tableName: "news_details",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return NewsDetails;
};
