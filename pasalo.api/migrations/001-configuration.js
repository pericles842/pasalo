'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuration', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      automatic_rate: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      type_rate: {
        type: Sequelize.ENUM('bcv', 'binance'),
        allowNull: false,
        defaultValue: 'bcv'
      },
      rate_manual: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.0
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'correo@gmail.com'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0424748578'
      },
      ig: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fb: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('configuration', null, {});
  }
};
