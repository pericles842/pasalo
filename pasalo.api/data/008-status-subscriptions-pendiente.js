'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_subscriptions', [
      { id: 4, name: 'Pendiente de verificación', description: 'La empresa pidió un plan pago y está esperando que se verifique el pago.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_subscriptions', { id: 4 }, {});
  }
};
