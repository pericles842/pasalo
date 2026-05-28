const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orders', {
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
            user_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name_product: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            name_client: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            ci_client: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            email_client: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            reference: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            pay_url_token: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true
            },
            status: {
                type: DataTypes.ENUM('pendiente', 'pagado', 'validado'),
                defaultValue: 'pendiente',
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
        await queryInterface.dropTable('orders');
    }

};


