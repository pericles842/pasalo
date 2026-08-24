'use strict';

/**
 * Soporte para verificacion manual del pago de la suscripcion:
 * - pending_plan_id: plan que la empresa pidio pero todavia no se ha
 *   verificado (el plan activo sigue siendo plan_id hasta que se confirme).
 * - expires_at: fecha de vencimiento del plan pago activo (null = no vence,
 *   como el plan gratuito).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies_subscriptions', 'pending_plan_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'plans',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'plan_id'
        });

        await queryInterface.addColumn('companies_subscriptions', 'expires_at', {
            type: Sequelize.DATE,
            allowNull: true,
            after: 'status_id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies_subscriptions', 'expires_at');
        await queryInterface.removeColumn('companies_subscriptions', 'pending_plan_id');
    }
};
