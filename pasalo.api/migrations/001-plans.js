'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('plans', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Nombre del plan'
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false
            },
            price: {
                type: Sequelize.DOUBLE,
                allowNull: false
            },
            user_limit: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            color_theme: {
                type: Sequelize.STRING,
                allowNull: false
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
        await queryInterface.dropTable('plans', null, {});
    }
};
