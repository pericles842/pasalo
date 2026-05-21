'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        await queryInterface.createTable('companies_connections', {
            uuid: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID
            },
            id_company: {
                allowNull: false,
                type: Sequelize.UUID,
                references: {
                    model: 'companies',
                    key: 'uuid'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            db_name: {
                allowNull: false,
                type: Sequelize.STRING(255)
            },
            db_host: {
                allowNull: false,
                type: Sequelize.STRING(255)
            },
            db_port: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            db_user: {
                allowNull: false,
                type: Sequelize.STRING(255)
            },
            db_password: {
                allowNull: false,
                type: Sequelize.STRING(255)
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
        await queryInterface.dropTable('companies_connections', null, {});
    }
};