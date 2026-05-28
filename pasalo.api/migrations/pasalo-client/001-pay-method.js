const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payment_methods', {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            company_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM('pagomovil', 'transferencia', 'billetera_digital'),
                allowNull: true
            },
            datos: {
                type: DataTypes.JSON,
                allowNull: true
            },
            titular: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            url_img: {
                type: DataTypes.STRING(255),
                allowNull: true
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
        await queryInterface.dropTable('payment_methods');
    }

};