"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.notifyOrderPaid = notifyOrderPaid;
const socket_io_1 = require("socket.io");
const auth_1 = require("../../utils/auth");
let io = null;
/**
 * Notificaciones en vivo del panel: cuando un cliente completa un pago,
 * se avisa al vendedor dueño de la orden y al administrador de la empresa.
 * Cada socket se autentica con el mismo JWT de la sesión.
 */
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ['https://tienda-online-j3m.vercel.app', 'http://localhost:4200'],
            credentials: true
        }
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                throw new Error('Token requerido');
            const session = (0, auth_1.verifyToken)(token);
            socket.data.session = session;
            next();
        }
        catch {
            next(new Error('No autorizado'));
        }
    });
    io.on('connection', (socket) => {
        const session = socket.data.session;
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
function notifyOrderPaid(tenant_id, seller_id, payload) {
    if (!io)
        return;
    io.to(`user:${seller_id}`)
        .to(`company:${tenant_id}:admin`)
        .emit('order:paid', payload);
}
