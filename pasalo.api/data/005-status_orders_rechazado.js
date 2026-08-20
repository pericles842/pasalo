'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_orders', [
      { id: 4, name: 'Rechazado', slug: 'rechazado', description: 'El vendedor revisó el comprobante y lo rechazó.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_orders', { id: 4 }, {});
  }
};
