'use strict';

/**
 * Cache persistente de la tasa del dolar (BCV / paralelo). Antes se pedia
 * a dolarapi.com en cada request (con cache en memoria de 30 min); ahora esa
 * llamada solo la hace el endpoint de sync (POST /exchange-rate/sync, disparado
 * por un demonio externo cada cierto tiempo) y el resto de la app lee de aqui.
 *
 * Es una tabla append-only: cada sync inserta una fila nueva y "la tasa actual"
 * es siempre la ultima. Así, si dolarapi.com se cae, el sync simplemente no
 * inserta nada nuevo y la app sigue sirviendo la ultima tasa conocida en vez
 * de tumbarse.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('rates', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            oficial: {
                type: Sequelize.DOUBLE,
                allowNull: true
            },
            paralelo: {
                type: Sequelize.DOUBLE,
                allowNull: true
            },
            fecha_oficial: {
                type: Sequelize.STRING,
                allowNull: true
            },
            fecha_paralelo: {
                type: Sequelize.STRING,
                allowNull: true
            },
            source: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'dolarapi'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // La tabla nunca debe estar vacia: se siembra una fila inicial (sin
        // datos todavia) para que getExchangeRates() siempre tenga algo que
        // leer, incluso antes de que el demonio corra el primer sync.
        await queryInterface.bulkInsert('rates', [{
            oficial: null,
            paralelo: null,
            fecha_oficial: null,
            fecha_paralelo: null,
            source: 'seed',
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('rates');
    }
};
