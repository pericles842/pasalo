'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Ventas realizadas: casos de éxito del usuario. Por ahora es un valor simbólico.
        await queryInterface.addColumn('users', 'sales_made', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            after: 'status'
        });

        // La cédula solo se pide al usuario master que registra la empresa;
        // los usuarios internos se crean sin ella.
        await queryInterface.changeColumn('users', 'ci', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'sales_made');
        await queryInterface.changeColumn('users', 'ci', {
            type: Sequelize.STRING(255),
            allowNull: false
        });
    }
};
