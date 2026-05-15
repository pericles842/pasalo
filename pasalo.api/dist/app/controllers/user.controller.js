"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_model_1 = require("../models/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../../utils/auth");
const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_REFRESH = process.env.JWT_REFRESH || "";
class UserController {
    /**
     *Crear usuario
     *
     * @static
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @memberof UserController
     */
    static async createUser(req, res, next) {
        try {
            // Encriptar la contraseña
            const passwordHash = await (0, auth_1.hashPassword)(req.body.password);
            // Agregar la contraseña encriptada
            req.body.password = passwordHash;
            const { id } = await user_model_1.Usuario.create(req.body);
            const [user] = await user_model_1.Usuario.getUsers(id);
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     *Controla la auteticacion del usuario genera el token y refresh tokeb
     *
     * @static
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @memberof UserController
     */
    static async authenticateUser(req, res, next) {
        try {
            const { email, password } = req.body;
            let user = await user_model_1.Usuario.findOne({ where: { email } });
            if (!user)
                throw "Credenciales inválidas";
            const match = await (0, auth_1.comparePassword)(password, user.password);
            if (!match)
                throw "Credenciales inválidas";
            let [full_user] = await user_model_1.Usuario.getUsers(user.id);
            const userNotPassword = {
                id: full_user.id,
                name: full_user.name,
                last_name: full_user.last_name,
                email: full_user.email,
                phone: full_user.phone,
                ci: full_user.ci,
                role: full_user.role,
                url_img: full_user.url_img,
                rol_id: full_user.rol_id,
                public_group_id: full_user.public_group_id,
                state_id: full_user.state_id,
                city_id: full_user.city_id,
                parish_id: full_user.parish_id,
                created_at: full_user.created_at,
            };
            const accessToken = jsonwebtoken_1.default.sign({ user: userNotPassword }, JWT_SECRET, {
                expiresIn: "2h",
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: userNotPassword.id }, JWT_REFRESH, {
                expiresIn: "7d",
            });
            //guardamos en la cokki hhtponly el refres token
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production" ? true : false, // solo https
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            });
            const { id, name, last_name, role, rol_id } = full_user;
            //jwt.verify(token, JWT_SECRET)
            res.json({
                user: { id, name, last_name, email, role, rol_id },
                accessToken,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     *Controla la auteticacion del usuario genera el token
     *
     * @static
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @memberof UserController
     */
    static async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                throw "No hay refresh token";
            }
            const payload = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH);
            const [full_user] = await user_model_1.Usuario.getUsers(payload.userId);
            const userNotPassword = {
                id: full_user.id,
                name: full_user.name,
                last_name: full_user.last_name,
                email: full_user.email,
                phone: full_user.phone,
                ci: full_user.ci,
                role: full_user.role,
                url_img: full_user.url_img,
                rol_id: full_user.rol_id,
                public_group_id: full_user.public_group_id,
                state_id: full_user.state_id,
                city_id: full_user.city_id,
                parish_id: full_user.parish_id,
                created_at: full_user.created_at,
            };
            const { id, name, last_name, role, rol_id, email } = full_user;
            const accessToken = jsonwebtoken_1.default.sign({ user: userNotPassword }, JWT_SECRET, {
                expiresIn: "2h",
            });
            res.json({
                user: { id, name, last_name, email, role, rol_id },
                accessToken,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
