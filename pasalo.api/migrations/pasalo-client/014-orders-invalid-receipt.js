const { DataTypes } = require('sequelize');

/**
 * Distingue por que una orden quedo "Rechazada" automaticamente al subir el
 * comprobante: la imagen no tenia suficientes digitos como para ser un
 * comprobante real (ver MIN_RECEIPT_DIGITS en public_order.controller). Sirve
 * para mostrar el motivo en el detalle sin confundirlo con un rechazo manual.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'is_invalid_receipt', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'is_suspicious'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'is_invalid_receipt');
    }
};
