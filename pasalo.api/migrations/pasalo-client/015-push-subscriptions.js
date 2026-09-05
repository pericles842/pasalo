const { DataTypes } = require('sequelize');

/**
 * Suscripciones Web Push por usuario: guarda el endpoint que entrega el
 * navegador al pedir permiso de notificaciones, para poder enviarle avisos
 * de pago aunque tenga la app/pestaña cerrada.
 *
 * endpoint_hash guarda un sha256 del endpoint (TEXT no se puede indexar unico
 * directo en MySQL sin un prefijo que arriesgue colisiones entre distintos
 * proveedores de push) y es lo que se usa para el upsert al resuscribirse.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('push_subscriptions', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            user_id: { type: DataTypes.UUID, allowNull: false },
            endpoint: { type: DataTypes.TEXT, allowNull: false },
            endpoint_hash: { type: DataTypes.STRING(64), allowNull: false },
            p256dh: { type: DataTypes.STRING(255), allowNull: false },
            auth: { type: DataTypes.STRING(255), allowNull: false },
            user_agent: { type: DataTypes.STRING(255), allowNull: true },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('push_subscriptions', ['user_id']);
        await queryInterface.addIndex('push_subscriptions', ['endpoint_hash'], {
            unique: true,
            name: 'push_subscriptions_endpoint_hash_unique'
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('push_subscriptions');
    }
};
