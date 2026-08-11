"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add product_variant_id to cart_items
    await queryInterface.addColumn("cart_items", "product_variant_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "product_variants",
        key: "id",
      },
      onDelete: "SET NULL",
    });

    // Add product_variant_id to order_details
    await queryInterface.addColumn("order_details", "product_variant_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "product_variants",
        key: "id",
      },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_details", "product_variant_id");
    await queryInterface.removeColumn("cart_items", "product_variant_id");
  },
};
