const { DataTypes } = require('sequelize');

/**
 * Notificaciones de pago: un registro persistente de "orden pagada",
 * ademas del aviso en vivo por websocket. Asi queda historial aunque
 * nadie haya estado conectado en el momento del pago.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notifications', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            order_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            // Vendedor dueño de la orden: define quien puede ver esta notificacion
            seller_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            buyer_name: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            reference: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notifications');
    }
};
