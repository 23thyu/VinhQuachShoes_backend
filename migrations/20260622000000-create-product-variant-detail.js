"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_variants_details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_variant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      attribute_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      attribute_value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_variants_details");
  },
};
