'use strict';

/**
 * Catalogo inicial de planes de publicidad. Precios de referencia (placeholder,
 * ajustar antes de vender): solo se siembran los placements que ya tienen slot
 * en el frontend (header y sidebar); modal/footer/dashboard_static se agregan
 * cuando tengan su componente.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('plans_ads', [
      { name: 'Header Dashboard', placement: 'header', priority: 5, price: 15, duration_days: 30, description: 'Banner horizontal en el header del dashboard, entre el logo de la empresa y las notificaciones.', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sidebar Vertical', placement: 'sidebar', priority: 5, price: 10, duration_days: 30, description: 'Banner vertical: debajo del menu de navegacion en el dashboard, y a los costados del login.', status: 'active', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plans_ads', null, {});
  }
};
