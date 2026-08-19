const { DataTypes } = require('sequelize');

/**
 * Captura del pago: el comprobante que sube el cliente, el metodo elegido
 * y lo que la extraccion automatica logro leer de la imagen.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'payment_method_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            after: 'status_id'
        });

        await queryInterface.addColumn('orders', 'receipt_url', {
            type: DataTypes.STRING(500),
            allowNull: true,
            after: 'payment_method_id'
        });

        await queryInterface.addColumn('orders', 'extracted_reference', {
            type: DataTypes.STRING(100),
            allowNull: true,
            after: 'receipt_url'
        });

        await queryInterface.addColumn('orders', 'extracted_raw_text', {
            type: DataTypes.TEXT,
            allowNull: true,
            after: 'extracted_reference'
        });

        await queryInterface.addColumn('orders', 'paid_at', {
            type: DataTypes.DATE,
            allowNull: true,
            after: 'extracted_raw_text'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'paid_at');
        await queryInterface.removeColumn('orders', 'extracted_raw_text');
        await queryInterface.removeColumn('orders', 'extracted_reference');
        await queryInterface.removeColumn('orders', 'receipt_url');
        await queryInterface.removeColumn('orders', 'payment_method_id');
    }
};
