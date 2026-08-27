"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = jwtMiddleware;
const auth_1 = require("../utils/auth");
/**
 * Valida el token de sesión y lo deja disponible en req.session.
 * La permisología por módulo se resuelve aparte.
 */
function jwtMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) {
        res.status(401).json({ message: 'No autorizado', error: 'Token requerido.' });
        return;
    }
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    try {
        req.session = (0, auth_1.verifyToken)(token);
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Sesión expirada', error: 'Tu sesión no es válida, vuelve a iniciar sesión.' });
    }
}
