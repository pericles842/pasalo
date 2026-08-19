const { DataTypes } = require('sequelize');

/** Cada renglon de productos de una orden */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_items', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
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
            name: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            reference: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('order_items');
    }
};
