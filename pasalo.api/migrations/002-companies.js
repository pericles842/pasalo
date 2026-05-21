'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      rif: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      user_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      }
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('companies', null, {});
  }
};
