const { DataTypes } = require('sequelize');

/**
 * Monto en bolivares fijado por el vendedor al crear la orden (editable,
 * pre-sugerido con la tasa activa de la empresa). Es lo que ve el comprador
 * en el link de pago: no se recalcula con la tasa del momento, para que el
 * vendedor no dependa 100% de la tasa y pueda corregir imprecisiones.
 * Nullable: ordenes viejas siguen usando el calculo en vivo como respaldo.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'bs_amount', {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            after: 'amount'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'bs_amount');
    }
};
