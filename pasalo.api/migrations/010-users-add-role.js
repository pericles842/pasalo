'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // El cargo pasa a ser un rol de la tabla `roles` (permisología se define luego)
        await queryInterface.addColumn('users', 'role_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
            after: 'password'
        });

        await queryInterface.removeColumn('users', 'charge');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'charge', {
            type: Sequelize.ENUM('support', 'seller'),
            allowNull: false
        });
        await queryInterface.removeColumn('users', 'role_id');
    }
};
