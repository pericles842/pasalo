'use strict';

/**
 * Duracion (en minutos) que le da la empresa a sus links publicos de pago
 * antes de que expiren. Configurable por el admin, 30 min por defecto,
 * tope de 2h (120 min) validado a nivel de aplicacion.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'link_expiration_minutes', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 30
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'link_expiration_minutes');
    }
};
