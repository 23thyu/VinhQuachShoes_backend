"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BannerDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BannerDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
      BannerDetail.belongsTo(models.Banner, {
        foreignKey: "banner_id",
        as: "banner",
      });
    }
  }
  BannerDetail.init(
    {
      product_id: DataTypes.INTEGER,
      banner_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "BannerDetail",
      tableName: "banner_details",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return BannerDetail;
};
