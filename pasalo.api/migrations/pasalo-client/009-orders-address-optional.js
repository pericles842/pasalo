const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('orders', 'address_client', {
            type: DataTypes.TEXT,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('orders', 'address_client', {
            type: DataTypes.TEXT,
            allowNull: false
        });
    }
};
