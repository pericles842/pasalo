'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_methods', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('pagomovil', 'tranferencia', 'billetera_digital', 'divisa'),
        allowNull: false,
        defaultValue: 'pagomovil'
      },
      datos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      holder: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      url_img: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('payment_methods', null, {});
  }
};
