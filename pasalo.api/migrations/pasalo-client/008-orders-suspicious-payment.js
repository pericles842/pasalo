const { DataTypes } = require('sequelize');

/**
 * Deteccion de pago sospechoso: se compara el monto leido del comprobante
 * contra lo que la orden espera (convertido a Bs si el metodo es en bolivares).
 * Si no coincide, la orden no pasa a "pagado" sola: queda marcada para revisar.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'extracted_amount', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            after: 'extracted_reference'
        });

        await queryInterface.addColumn('orders', 'is_suspicious', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'extracted_amount'
        });

        await queryInterface.addColumn('notifications', 'is_suspicious', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('notifications', 'is_suspicious');
        await queryInterface.removeColumn('orders', 'is_suspicious');
        await queryInterface.removeColumn('orders', 'extracted_amount');
    }
};
