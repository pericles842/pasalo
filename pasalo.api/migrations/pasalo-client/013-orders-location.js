const { DataTypes } = require('sequelize');

/**
 * Punto exacto de entrega que el comprador marca en el mapa (precisa o a
 * mano), ademas del texto libre que ya existia en address_client. Nullable:
 * es opcional salvo que la empresa marque "Ubicacion" como campo requerido.
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.addColumn('orders', 'lat', {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true,
            after: 'address_client'
        });
        await queryInterface.addColumn('orders', 'lng', {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: true,
            after: 'lat'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('orders', 'lng');
        await queryInterface.removeColumn('orders', 'lat');
    }
};
