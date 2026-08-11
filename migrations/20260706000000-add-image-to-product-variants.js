"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("product_variants");
    if (!tableDefinition.image) {
      await queryInterface.addColumn("product_variants", "image", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("product_variants");
    if (tableDefinition.image) {
      await queryInterface.removeColumn("product_variants", "image");
    }
  },
};
