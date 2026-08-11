"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Order.hasMany(models.OrderDetail, {
        foreignKey: "order_id",
        as: "order_details",
      });
    }
  }
  Order.init(
    {
      user_id: DataTypes.INTEGER,
      session_id: DataTypes.STRING,
      status: DataTypes.INTEGER,
      note: DataTypes.TEXT,
      phone: DataTypes.TEXT,
      address: DataTypes.TEXT,
      total: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Order;
};
