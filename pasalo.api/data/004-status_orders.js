'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_orders', [
      { id: 1, name: 'En espera', slug: 'pendiente', description: 'El cliente aún no ha subido su comprobante de pago.', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Pagado', slug: 'pagado', description: 'El pago fue recibido y validado por el vendedor.', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Atrasado', slug: 'atrasado', description: 'La orden lleva demasiado tiempo sin pago.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_orders', null, {});
  }
};
