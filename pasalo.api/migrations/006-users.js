'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            uuid: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
            },
            first_name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            middle_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            photo_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            ci: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            charge: {
                type: Sequelize.ENUM('support', 'seller'),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive', 'baned'),
                allowNull: false
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
        await queryInterface.dropTable('users', null, {});
    }
};
