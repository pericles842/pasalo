'use strict';

/**
 * Soporte para "Iniciar sesion con Google": google_id identifica la cuenta de
 * Google vinculada (se autovincula la primera vez que un email coincide con
 * un usuario existente). password pasa a ser opcional porque una cuenta
 * creada solo por Google no tiene contraseña.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'google_id', {
            type: Sequelize.STRING(255),
            allowNull: true,
            unique: true,
            after: 'password'
        });

        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING(255),
            allowNull: false
        });

        await queryInterface.removeColumn('users', 'google_id');
    }
};
