'use strict';

/**
 * Anuncios contratados por empresas anunciantes. Cada anuncio apunta a una
 * carpeta exclusiva en /uploads/ads/{folder_name} (una carpeta = una empresa,
 * con N fotos dentro). La foto a mostrar se elige al azar entre las de esa
 * carpeta; que anuncio se elige para un placement dado se pondera por
 * `priority`, no es un ranking fijo (uno de prioridad baja igual puede salir,
 * solo que con menor frecuencia).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ads', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            plan_ads_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'plans_ads',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            company_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            folder_name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            target_url: {
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
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            price_charged: {
                type: Sequelize.DOUBLE,
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('active', 'paused', 'expired'),
                allowNull: false,
                defaultValue: 'active'
            },
            impressions_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            clicks_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
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
        await queryInterface.dropTable('ads');
    }
};
