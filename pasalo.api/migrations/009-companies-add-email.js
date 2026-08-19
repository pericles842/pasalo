'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Correo corporativo: canal oficial de la empresa dentro de Pásalo
        await queryInterface.addColumn('companies', 'email', {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
            after: 'rif'
        });

        // El límite de usuarios ya no se captura en el formulario:
        // lo define el plan al que se suscribe la empresa.
        await queryInterface.changeColumn('companies', 'user_limit', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'email');
        await queryInterface.changeColumn('companies', 'user_limit', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1
        });
    }
};
