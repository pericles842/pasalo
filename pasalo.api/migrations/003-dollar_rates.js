'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('dollar_rates', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      key: {
        type: Sequelize.ENUM('bcv', 'binance'),
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        primaryKey: true
      },
      last_update: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      price_old: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      price: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      url_img: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.dropTable('dollar_rates', null, {});
  }
};
