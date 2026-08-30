import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../../utils/auth';
import { SessionPayload } from '../../middlewares/jwtMiddleware';
import { corsOrigins } from './cors';

let io: Server | null = null;

/**
 * Notificaciones en vivo del panel: cuando un cliente completa un pago,
 * se avisa al vendedor dueño de la orden y al administrador de la empresa.
 * Cada socket se autentica con el mismo JWT de la sesión.
 */
export function initSocket(server: HttpServer): Server {
    io = new Server(server, {
        cors: {
            origin: corsOrigins,
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token as string | undefined;
            if (!token) throw new Error('Token requerido');

            const session = verifyToken<SessionPayload>(token);
            (socket.data as any).session = session;
            next();
        } catch {
            next(new Error('No autorizado'));
        }
    });

    io.on('connection', (socket) => {
        const session = (socket.data as any).session as SessionPayload;

        // Cada usuario escucha sus propias notificaciones...
        socket.join(`user:${session.user.uuid}`);

        // ...y el administrador ademas escucha las de toda la empresa
        if (session.role === 'admin') {
            socket.join(`company:${session.company.tenant_id}:admin`);
        }
    });

    return io;
}

/**
 * Avisa al vendedor de la orden y al administrador de la empresa
 * que un cliente acaba de completar el pago.
 */
export function notifyOrderPaid(tenant_id: string, seller_id: string, payload: unknown): void {
    if (!io) return;

    io.to(`user:${seller_id}`)
        .to(`company:${tenant_id}:admin`)
        .emit('order:paid', payload);
}

/**
 * Avisa al vendedor de la orden y al administrador de la empresa que el
 * estado de una orden cambio (verificada, rechazada, etc.), para que la
 * insignia de "pendientes por verificar" del menu se actualice sin recargar.
 */
export function notifyOrderStatusChanged(tenant_id: string, seller_id: string, payload: unknown): void {
    if (!io) return;

    io.to(`user:${seller_id}`)
        .to(`company:${tenant_id}:admin`)
        .emit('order:status-changed', payload);
}
