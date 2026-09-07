import { createHash } from 'crypto';
import { QueryTypes, Sequelize } from 'sequelize';
import webpush from 'web-push';

let vapid_configured = false;

/** A donde lleva el toque en la notificacion: el listado de ordenes del dashboard */
const ORDERS_LIST_URL = '/dashboard/list';

/** Configura las llaves VAPID la primera vez que se necesitan (no al importar el modulo, por si el .env aun no cargo). */
function ensureVapidConfigured(): void {
    if (vapid_configured) return;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
        throw new Error('Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT en el .env');
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapid_configured = true;
}

export function hashEndpoint(endpoint: string): string {
    return createHash('sha256').update(endpoint).digest('hex');
}

export interface PushPayload {
    title: string;
    body: string;
    order_id: string;
    icon?: string;
}

/**
 * Envia una notificacion push a todas las suscripciones activas de un
 * usuario. Nunca lanza: un fallo de push no debe romper el flujo que lo
 * dispara (ej. el registro de un pago). Limpia automaticamente las
 * suscripciones que el navegador ya invalido (404/410).
 */
export async function sendPushToUser(tenantDb: Sequelize, user_id: string, payload: PushPayload): Promise<void> {
    try {
        ensureVapidConfigured();

        const subscriptions = await tenantDb.query<any>(
            `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = :user_id`,
            { replacements: { user_id }, type: QueryTypes.SELECT }
        );

        if (!subscriptions.length) return;

        const body = JSON.stringify({
            notification: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon ?? '/icons/icon-192.png',
                data: {
                    order_id: payload.order_id,
                    // Sin onActionClick el service worker de Angular solo le avisa a las
                    // pestanas abiertas y no hace nada mas: con la app cerrada (que es el
                    // caso normal de un push) tocar la notificacion no abre nada.
                    // navigateLastFocusedOrOpen enfoca la app si ya estaba abierta y la
                    // lleva al listado, o abre una ventana nueva ahi si estaba cerrada.
                    onActionClick: {
                        default: { operation: 'navigateLastFocusedOrOpen', url: ORDERS_LIST_URL },
                    },
                },
            },
        });

        await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    body
                );
            } catch (err: any) {
                if (err?.statusCode === 404 || err?.statusCode === 410) {
                    await tenantDb.query(`DELETE FROM push_subscriptions WHERE id = :id`, { replacements: { id: sub.id } });
                } else {
                    console.error('[web-push] error enviando a', sub.id, err?.message ?? err);
                }
            }
        }));
    } catch (err) {
        console.error('[web-push] sendPushToUser fallo:', err);
    }
}
