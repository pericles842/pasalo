'use strict';

/**
 * `plans_ads` deja de tener un placement fijo: las ubicaciones que incluye
 * un plan ahora se arman en `plan_ads_locations`. De paso se reemplaza el
 * catalogo semilla (antes: un plan por placement) por los planes reales que
 * se van a vender: "Plan Dashboard" (header + footer del menu, mismas fotos
 * rotando en ambos) y "Modal Emergente" (popup periodico).
 *
 * Cierra tambien lo que dejo pendiente la migracion 023: cualquier `ads` que
 * ya exista y haya quedado con `plan_ads_id` nulo (por ejemplo, anuncios de
 * prueba creados antes de este refactor) se asigna al plan "Modal Emergente"
 * — son los unicos con `interval_seconds` corto, seña de que se usaban para
 * probar el popup — y recien ahi `plan_ads_id` pasa a ser NOT NULL.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plan_ads_locations', null, {});
    await queryInterface.bulkDelete('plans_ads', null, {});
    await queryInterface.removeColumn('plans_ads', 'placement');

    await queryInterface.bulkInsert('plans_ads', [
      {
        name: 'Plan Dashboard',
        price: 22,
        duration_days: 30,
        description: 'Banner en el header del dashboard y en el footer del menu lateral: las mismas fotos rotando en ambos espacios.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Modal Emergente',
        price: 20,
        duration_days: 30,
        description: 'Popup que aparece periodicamente sobre el dashboard mientras la empresa navega.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);

    const [plans] = await queryInterface.sequelize.query('SELECT id, name FROM plans_ads');
    const [locations] = await queryInterface.sequelize.query('SELECT id, `key` FROM ads_locations');

    const planId = (name) => plans.find((p) => p.name === name).id;
    const locationId = (key) => locations.find((l) => l.key === key).id;

    await queryInterface.bulkInsert('plan_ads_locations', [
      { plan_ads_id: planId('Plan Dashboard'), ad_location_id: locationId('header-dashboard'), createdAt: new Date(), updatedAt: new Date() },
      { plan_ads_id: planId('Plan Dashboard'), ad_location_id: locationId('footer-menu-dashboard'), createdAt: new Date(), updatedAt: new Date() },
      { plan_ads_id: planId('Modal Emergente'), ad_location_id: locationId('modal'), createdAt: new Date(), updatedAt: new Date() },
    ]);

    await queryInterface.sequelize.query(
      'UPDATE ads SET plan_ads_id = :modalPlanId WHERE plan_ads_id IS NULL',
      { replacements: { modalPlanId: planId('Modal Emergente') } }
    );

    await queryInterface.changeColumn('ads', 'plan_ads_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ads', 'plan_ads_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('plans_ads', 'placement', {
      type: Sequelize.ENUM('header', 'footer', 'sidebar', 'dashboard_static', 'modal'),
      allowNull: true
    });
    await queryInterface.bulkDelete('plan_ads_locations', null, {});
    await queryInterface.bulkDelete('plans_ads', null, {});
  }
};
