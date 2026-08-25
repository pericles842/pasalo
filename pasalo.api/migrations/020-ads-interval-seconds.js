'use strict';

/**
 * Cada cuantos segundos debe volver a dispararse este anuncio (usado sobre
 * todo por el placement `modal`, que no se muestra en cada refresh sino cada
 * cierto tiempo). Si es null, el placement no usa temporizador (header,
 * footer, sidebar, dashboard_static se piden de nuevo en cada carga de pagina).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('ads', 'interval_seconds', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('ads', 'interval_seconds');
    }
};
