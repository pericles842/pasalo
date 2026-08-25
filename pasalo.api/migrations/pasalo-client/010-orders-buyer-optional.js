const { DataTypes } = require('sequelize');

/**
 * El vendedor ya no llena los datos del comprador al crear la orden: ahora
 * los llena el cliente en el paso 1 del link publico de pago. Por eso estas
 * columnas quedan nulas desde la creacion hasta que el cliente las completa.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('orders', 'last_name_client', {
            type: DataTypes.STRING(255),
            allowNull: true
        });

        await queryInterface.changeColumn('orders', 'ci_client', {
            type: DataTypes.STRING(20),
            allowNull: true
        });

        await queryInterface.changeColumn('orders', 'phone_client', {
            type: DataTypes.STRING(30),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('orders', 'phone_client', {
            type: DataTypes.STRING(30),
            allowNull: false
        });

        await queryInterface.changeColumn('orders', 'ci_client', {
            type: DataTypes.STRING(20),
            allowNull: false
        });

        await queryInterface.changeColumn('orders', 'last_name_client', {
            type: DataTypes.STRING(255),
            allowNull: false
        });
    }
};
