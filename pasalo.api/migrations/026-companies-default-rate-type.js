'use strict';

/**
 * La empresa elige con cual tasa (bcv, eur o el promedio entre ambas) se
 * convierten sus montos a bolivares: validacion de comprobantes y lo que ve
 * el comprador en el link de pago. Por defecto BCV, para no cambiar el
 * comportamiento de las empresas ya existentes.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'default_rate_type', {
            type: Sequelize.ENUM('bcv', 'eur', 'promedio'),
            allowNull: false,
            defaultValue: 'bcv'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'default_rate_type');
    }
};
