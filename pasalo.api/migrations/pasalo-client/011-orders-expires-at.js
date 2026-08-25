const { DataTypes } = require('sequelize');

/**
 * Vencimiento del link publico de pago, calculado al crear la orden segun
 * companies.link_expiration_minutes de ese momento. Null = ordenes viejas,
 * creadas antes de esta funcionalidad: para esas el link no vence.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'expires_at', {
            type: DataTypes.DATE,
            allowNull: true,
            after: 'pay_url_token'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'expires_at');
    }
};
