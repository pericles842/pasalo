"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const user_model_1 = require("../models/user.model");
const role_model_1 = require("../models/role.model");
const company_user_model_1 = require("../models/company_user.model");
const company_model_1 = require("../models/company.model");
const auth_1 = require("../../utils/auth");
const storage_1 = require("../../utils/storage");
class AuthController {
    /**
     * Inicia sesion con el correo personal y la contraseña del usuario.
     * Devuelve el token con el usuario, su rol y la empresa a la que pertenece.
     *
     * @static
     * @memberof AuthController
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Debes ingresar tu correo y tu contraseña.' });
                return;
            }
            const user = await user_model_1.UserModel.findOne({ where: { email } });
            // Mismo mensaje para correo inexistente y contraseña errada:
            // no le decimos a nadie cuáles correos están registrados
            if (!user || !(await (0, auth_1.comparePassword)(password, user.password))) {
                res.status(401).json({ message: 'Credenciales inválidas', error: 'Correo o contraseña incorrectos.' });
                return;
            }
            if (user.status !== 'active') {
                res.status(403).json({ message: 'Usuario inhabilitado', error: 'Tu usuario no está activo, contacta al administrador de tu empresa.' });
                return;
            }
            const role = await role_model_1.RoleModel.findByPk(user.role_id);
            const company_user = await company_user_model_1.CompanyUserModel.findOne({ where: { user_id: user.uuid } });
            const company = company_user ? await company_model_1.CompanyModel.findByPk(company_user.company_id) : null;
            if (!company) {
                res.status(403).json({ message: 'Empresa no encontrada', error: 'Tu usuario no está vinculado a ninguna empresa.' });
                return;
            }
            // El company_id y el tenant_id viajan en el token:
            // con ellos sabemos a qué base de datos conectarnos en cada request
            const token = (0, auth_1.generateToken)({
                user: {
                    uuid: user.uuid,
                    first_name: user.first_name,
                    middle_name: user.middle_name,
                    email: user.email,
                    photo_url: user.photo_url,
                    role_id: user.role_id
                },
                role: role?.slug ?? null,
                company: {
                    uuid: company.uuid,
                    name: company.name,
                    tenant_id: company.tenant_id
                }
            });
            res.json({
                token,
                expires_in: auth_1.JWT_EXPIRES_IN,
                user,
                role,
                company
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Devuelve la sesion actual a partir del token
     *
     * @static
     * @memberof AuthController
     */
    static async me(req, res, next) {
        try {
            const session = req.session;
            const user = await user_model_1.UserModel.findByPk(session.user.uuid);
            if (!user || user.status !== 'active') {
                res.status(401).json({ message: 'Sesión inválida', error: 'Vuelve a iniciar sesión.' });
                return;
            }
            const role = await role_model_1.RoleModel.findByPk(user.role_id);
            const company = await company_model_1.CompanyModel.findByPk(session.company.uuid);
            res.json({ user, role, company });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Cada usuario edita su propio nombre, foto y (opcionalmente) su contraseña.
     *
     * @static
     * @memberof AuthController
     */
    static async updateMe(req, res, next) {
        try {
            const session = req.session;
            const { first_name, middle_name, current_password, new_password, new_password_confirmation } = req.body;
            if (!first_name) {
                res.status(400).json({ message: 'Datos incompletos', error: 'El nombre es requerido.' });
                return;
            }
            const user = await user_model_1.UserModel.findByPk(session.user.uuid);
            if (!user) {
                res.status(401).json({ message: 'Sesión inválida', error: 'Vuelve a iniciar sesión.' });
                return;
            }
            // El cambio de contraseña es opcional: solo si el usuario llenó los campos
            if (new_password || current_password || new_password_confirmation) {
                if (!current_password || !new_password || !new_password_confirmation) {
                    res.status(400).json({ message: 'Datos incompletos', error: 'Completa la contraseña actual y la nueva contraseña para cambiarla.' });
                    return;
                }
                if (!(await (0, auth_1.comparePassword)(current_password, user.password))) {
                    res.status(401).json({ message: 'Contraseña incorrecta', error: 'Tu contraseña actual no es correcta.' });
                    return;
                }
                if (new_password !== new_password_confirmation) {
                    res.status(400).json({ message: 'Contraseña inválida', error: 'La confirmación de la nueva contraseña no coincide.' });
                    return;
                }
                user.password = await (0, auth_1.hashPassword)(new_password);
            }
            user.first_name = first_name;
            user.middle_name = middle_name ?? null;
            const file = req.file;
            if (file) {
                const { url } = await (0, storage_1.uploadFile)(file, `avatars/${session.company.tenant_id}`, 'webp', { width: 512, height: 512, fit: 'inside' });
                user.photo_url = url;
            }
            await user.save();
            const role = await role_model_1.RoleModel.findByPk(user.role_id);
            const company = await company_model_1.CompanyModel.findByPk(session.company.uuid);
            res.json({ user, role, company });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
