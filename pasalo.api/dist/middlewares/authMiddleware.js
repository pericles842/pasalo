"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const role_model_1 = require("../app/models/role.model");
const JWT_SECRET = process.env.JWT_SECRET || "";
async function authMiddleware(req, res, next) {
    const token = req.headers["authorization"];
    const module_id = req.headers["module_id"];
    if (!token)
        throw "Token requerido";
    if (!module_id)
        throw "Modulo requerido";
    try {
        const payload_jwt = (await jsonwebtoken_1.default.verify(token, JWT_SECRET));
        const permissions = await role_model_1.UserPermissions.getUserPermission(payload_jwt.user.uuid);
        const [module_access] = permissions.filter((p) => p.module_id == parseInt(module_id));
        //errores de acceso
        if (req.method === "GET" && !module_access.can_view)
            throw `Acceso denegado en el modulo de ${module_access.module}, no puedes ver este recurso`;
        if (req.method === "POST" && !module_access.can_create)
            throw `Acceso denegado en el modulo de ${module_access.module}, no puedes crear este recurso`;
        if (req.method === "PUT" && !module_access.can_update)
            throw `Acceso denegado en el modulo de ${module_access.module}, no puedes actualizar este recurso`;
        if (req.method === "DELETE" && !module_access.can_delete)
            throw `Acceso denegado en el modulo de ${module_access.module}, no puedes eliminar este recurso`;
        next();
    }
    catch (err) {
        throw err;
    }
}
