'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_orders', [
      { id: 5, name: 'Verificado', slug: 'verificado', description: 'El vendedor revisó el comprobante y confirmó que el pago es correcto.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_orders', { id: 5 }, {});
  }
};
