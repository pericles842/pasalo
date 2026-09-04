'use strict';

/**
 * El correo de la empresa ya no es obligatorio al registrarse (igual que el RIF
 * y el dominio). Sigue siendo unico: varias empresas pueden quedar con email NULL,
 * pero no compartir el mismo correo. El controlador guarda NULL cuando llega vacio.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('companies', 'email', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('companies', 'email', {
            type: Sequelize.STRING(255),
            allowNull: false
        });
    }
};
