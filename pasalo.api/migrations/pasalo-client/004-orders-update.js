const { DataTypes } = require('sequelize');

/**
 * La orden ahora representa la venta completa: datos del comprador +
 * observaciones + estado. Los productos se mueven a su propia tabla
 * (order_items) porque una orden puede tener varios.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'name_product');
        await queryInterface.removeColumn('orders', 'status');

        await queryInterface.renameColumn('orders', 'name_client', 'first_name_client');

        await queryInterface.addColumn('orders', 'last_name_client', {
            type: DataTypes.STRING(255),
            allowNull: false,
            after: 'first_name_client'
        });

        await queryInterface.changeColumn('orders', 'ci_client', {
            // Se guarda como texto para no perder el prefijo (V/E/J/P) ni ceros a la izquierda
            type: DataTypes.STRING(20),
            allowNull: false
        });

        await queryInterface.addColumn('orders', 'phone_client', {
            type: DataTypes.STRING(30),
            allowNull: false,
            after: 'ci_client'
        });

        await queryInterface.addColumn('orders', 'address_client', {
            type: DataTypes.TEXT,
            allowNull: false,
            after: 'phone_client'
        });

        await queryInterface.addColumn('orders', 'notes', {
            type: DataTypes.TEXT,
            allowNull: true,
            after: 'reference'
        });

        // El catalogo de estados vive en la base master (status_orders);
        // aqui solo se guarda el id, igual que companies_subscriptions.status_id
        await queryInterface.addColumn('orders', 'status_id', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            after: 'notes'
        });

        await queryInterface.changeColumn('orders', 'user_id', {
            type: DataTypes.UUID,
            allowNull: false
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('orders', 'user_id', {
            type: DataTypes.UUID,
            allowNull: true
        });
        await queryInterface.removeColumn('orders', 'status_id');
        await queryInterface.removeColumn('orders', 'notes');
        await queryInterface.removeColumn('orders', 'address_client');
        await queryInterface.removeColumn('orders', 'phone_client');
        await queryInterface.changeColumn('orders', 'ci_client', {
            type: DataTypes.INTEGER,
            allowNull: true
        });
        await queryInterface.removeColumn('orders', 'last_name_client');
        await queryInterface.renameColumn('orders', 'first_name_client', 'name_client');
        await queryInterface.addColumn('orders', 'status', {
            type: DataTypes.ENUM('pendiente', 'pagado', 'validado'),
            defaultValue: 'pendiente',
            allowNull: false
        });
        await queryInterface.addColumn('orders', 'name_product', {
            type: DataTypes.STRING(255),
            allowNull: true
        });
    }
};
