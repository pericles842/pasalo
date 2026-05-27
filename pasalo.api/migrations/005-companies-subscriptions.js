'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('companies_subscriptions', {
            uuid: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
            },
            company_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: 'companies',
                    key: 'uuid'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            plan_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'plans',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'status_subscriptions',
                    key: 'id'
                },
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
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.dropTable('companies_subscriptions', null, {});
    }
};
