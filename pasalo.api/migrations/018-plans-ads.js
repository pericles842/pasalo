'use strict';

/**
 * Catalogo de planes de publicidad que se le venden a las empresas anunciantes
 * (no confundir con `plans`, que son los planes de suscripcion de Pasalo).
 * Cada plan define un placement y una prioridad/precio sugeridos; al crear un
 * `ad` concreto se puede heredar o sobreescribir esos valores segun lo negociado.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('plans_ads', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            placement: {
                type: Sequelize.ENUM('header', 'footer', 'sidebar', 'dashboard_static', 'modal'),
                allowNull: false
            },
            priority: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price: {
                type: Sequelize.DOUBLE,
                allowNull: false
            },
            duration_days: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 30
            },
            description: {
                type: Sequelize.STRING,
                allowNull: true
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
    },

    async down(queryInterface) {
        await queryInterface.dropTable('plans_ads');
    }
};
