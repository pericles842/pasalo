'use strict';

/**
 * Catalogo de ubicaciones de publicidad. Anadir una ubicacion nueva (ej. un
 * banner en el footer publico) es insertar una fila aca y usarla al armar
 * un plan (`plan_ads_locations`), sin tocar ningun enum ni el motor de
 * anuncios.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ads_locations', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.bulkInsert('ads_locations', [
      { key: 'header-dashboard', name: 'Header del Dashboard', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { key: 'footer-menu-dashboard', name: 'Footer del Menú (Dashboard)', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { key: 'modal', name: 'Modal Emergente', status: 'active', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ads_locations');
  }
};
