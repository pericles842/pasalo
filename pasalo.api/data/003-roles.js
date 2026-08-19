'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      { id: 1, name: 'Administrador', slug: 'admin', description: 'Usuario master de la empresa. Gestiona la suscripción y los usuarios internos.', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Soporte', slug: 'support', description: 'Atiende y valida los pagos recibidos.', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Vendedor', slug: 'seller', description: 'Genera los links de cobro de la empresa.', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
