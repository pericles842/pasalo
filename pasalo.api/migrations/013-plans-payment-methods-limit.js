'use strict';

/**
 * Cada plan ahora tambien define cuantos metodos de pago puede
 * registrar la empresa (antes no habia limite).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('plans', 'payment_methods_limit', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 3,
            after: 'user_limit'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('plans', 'payment_methods_limit');
    }
};
