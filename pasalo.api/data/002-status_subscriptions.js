'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_subscriptions', [
      { id: 1, name: 'Activo', description: 'Servicio funcionando correctamente.', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Suspendido', description: 'Servicio suspendido.', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Vencido', description: 'Servicio Vencido.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_subscriptions', null, {});
  }
};
