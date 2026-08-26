'use strict';

/**
 * Relacion N:M entre `plans_ads` y `ad_locations`: un plan puede incluir
 * varias ubicaciones a la vez (ej. un plan "Dashboard" que cubre el header
 * y el footer del menu con las mismas fotos).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plan_ads_locations', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      plan_ads_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'plans_ads', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ad_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ads_locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('plan_ads_locations', ['plan_ads_id', 'ad_location_id'], {
      unique: true,
      name: 'plan_ads_locations_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plan_ads_locations');
  }
};
