'use strict';

/**
 * La empresa define cuales datos del comprador son obligatorios en el paso 1
 * del link publico de pago (metodo de pago y comprobante siempre son
 * obligatorios, no se incluyen aqui). Nullable a proposito: MySQL no admite
 * un literal como default de columna JSON, asi que las filas existentes se
 * rellenan aqui mismo con el default (nombre + correo), y el codigo de la
 * app usa ese mismo arreglo como fallback cuando la columna viene null.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'required_buyer_fields', {
            type: Sequelize.JSON,
            allowNull: true
        });

        await queryInterface.sequelize.query(
            `UPDATE companies SET required_buyer_fields = :fields`,
            { replacements: { fields: JSON.stringify(['first_name', 'last_name', 'email']) } }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'required_buyer_fields');
    }
};
