"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FeedBack extends Model {
    static associate(models) {
      // define association here
    }
  }
  FeedBack.init(
    {
      content: DataTypes.TEXT,
      image_url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "FeedBack",
      tableName: "feedbacks",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return FeedBack;
};
