'use strict';

/**
 * El dominio ya no es obligatorio al registrar una empresa: si no se da,
 * el tenant_id se saca del nombre de la empresa (ver CompanyController.registerCompanyProcess).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('companies', 'domain', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('companies', 'domain', {
            type: Sequelize.STRING(255),
            allowNull: false
        });
    }
};
