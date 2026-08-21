'use strict';

/**
 * Fija el limite de metodos de pago en los planes ya sembrados (el seeder
 * 001 solo corre una vez, asi que las bases existentes necesitan este update).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const limits = { 1: 3, 2: 5, 3: 8, 4: 15 };

        for (const [id, payment_methods_limit] of Object.entries(limits)) {
            await queryInterface.bulkUpdate(
                'plans',
                { payment_methods_limit, updatedAt: new Date() },
                { id }
            );
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkUpdate(
            'plans',
            { payment_methods_limit: 3, updatedAt: new Date() },
            {}
        );
    }
};
