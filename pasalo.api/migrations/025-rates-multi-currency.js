'use strict';

/**
 * dolarapi.com cambio de endpoint: de /v1/dolares (oficial/paralelo del USD)
 * a /v1/cotizaciones (oficial de USD y EUR). La tabla pasa a guardar bcv, eur
 * y el promedio entre ambos, calculado una sola vez al sincronizar. Se deja
 * de guardar el paralelo: el nuevo endpoint no lo trae.
 *
 * Las dos fechas (fecha_oficial/fecha_paralelo) se colapsan en una sola
 * `fecha`, porque bcv y eur salen de la misma respuesta/sincronizacion.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameColumn('rates', 'oficial', 'bcv');
        await queryInterface.renameColumn('rates', 'fecha_oficial', 'fecha');

        await queryInterface.addColumn('rates', 'eur', {
            type: Sequelize.DOUBLE,
            allowNull: true
        });

        await queryInterface.addColumn('rates', 'promedio', {
            type: Sequelize.DOUBLE,
            allowNull: true
        });

        await queryInterface.removeColumn('rates', 'paralelo');
        await queryInterface.removeColumn('rates', 'fecha_paralelo');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('rates', 'paralelo', {
            type: Sequelize.DOUBLE,
            allowNull: true
        });

        await queryInterface.addColumn('rates', 'fecha_paralelo', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.removeColumn('rates', 'promedio');
        await queryInterface.removeColumn('rates', 'eur');

        await queryInterface.renameColumn('rates', 'fecha', 'fecha_oficial');
        await queryInterface.renameColumn('rates', 'bcv', 'oficial');
    }
};
