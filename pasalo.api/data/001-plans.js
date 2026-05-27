'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('plans', [
      { id: 1, name: 'Plan Gratuito', price: 0, description: 'Ideal para comenzar. Acceso básico a la plataforma sin costo.', user_limit: 1, color_theme: '#F7FAFF', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Plan Premium', price: 29, description: 'Para negocios en crecimiento. Más usuarios y funciones avanzadas.', user_limit: 3, color_theme: '#F7FAFF', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Plan Pro', price: 59, description: 'Potencia tu negocio con integraciones y analytics en tiempo real.', user_limit: 5, color_theme: '#F7FAFF', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Plan Business', price: 99, description: 'Potencia tu negocio con integraciones y analytics en tiempo real.', user_limit: 10, color_theme: '#F7FAFF', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plans', null, {});
  }
};
