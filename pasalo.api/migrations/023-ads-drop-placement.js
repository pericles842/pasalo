'use strict';

/**
 * `ads` deja de guardar su propio placement: la ubicacion (o ubicaciones)
 * donde aparece las define el plan contratado, via `plan_ads_id` ->
 * `plan_ads_locations`. `plan_ads_id` se deja nullable aca a proposito: la
 * migracion 024 es la que crea los planes reales y rellena esta columna
 * para los `ads` que ya existan, y recien ahi la vuelve NOT NULL.
 *
 * Idempotente a proposito: un intento anterior de esta migracion llego a
 * dropear las columnas pero fallo antes de que sequelize-cli lo registrara
 * como aplicada, asi que un reintento se encuentra las columnas ya ausentes.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('ads');

    if (columns.placement) {
      await queryInterface.removeColumn('ads', 'placement');
    }

    if (columns.plan_ads_id) {
      await queryInterface.removeColumn('ads', 'plan_ads_id');
    }

    await queryInterface.addColumn('ads', 'plan_ads_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'plans_ads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ads', 'plan_ads_id');
    await queryInterface.addColumn('ads', 'plan_ads_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'plans_ads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('ads', 'placement', {
      type: Sequelize.ENUM('header', 'footer', 'sidebar', 'dashboard_static', 'modal'),
      allowNull: false
    });
  }
};
