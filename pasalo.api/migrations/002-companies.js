'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
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
        allowNull: false,
        unique: true
      },
      tenant_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      user_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
