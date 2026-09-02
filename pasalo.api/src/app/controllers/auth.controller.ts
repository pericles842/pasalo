import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { RoleModel } from '../models/role.model';
import { CompanyUserModel } from '../models/company_user.model';
import { CompanyModel } from '../models/company.model';
import { comparePassword, generateToken, hashPassword, JWT_EXPIRES_IN } from '../../utils/auth';
import { verifyGoogleToken } from '../../utils/googleAuth';
import { uploadFile } from '../../utils/storage';
import { buildImagePrefix } from '../../utils/fileNaming';

export class AuthController {

    /**
     * Arma el JWT + rol + empresa de un usuario ya autenticado (por
     * contraseña o por Google). Devuelve null si el usuario no esta
     * vinculado a ninguna empresa: el caller decide como responder eso.
     */
    private static async issueSession(user: UserModel): Promise<{ token: string; role: RoleModel | null; company: CompanyModel } | null> {
        const role = await RoleModel.findByPk(user.role_id);
        const company_user = await CompanyUserModel.findOne({ where: { user_id: user.uuid } });
        const company = company_user ? await CompanyModel.findByPk(company_user.company_id) : null;

        if (!company) return null;

        // El company_id y el tenant_id viajan en el token:
        // con ellos sabemos a qué base de datos conectarnos en cada request
        const token = generateToken({
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

        return { token, role, company };
    }

    /**
     * Inicia sesion con el correo personal y la contraseña del usuario.
     * Devuelve el token con el usuario, su rol y la empresa a la que pertenece.
     *
     * @static
     * @memberof AuthController
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Debes ingresar tu correo y tu contraseña.' });
                return;
            }

            const user = await UserModel.findOne({ where: { email } });

            // Mismo mensaje para correo inexistente y contraseña errada:
            // no le decimos a nadie cuáles correos están registrados.
            // Una cuenta creada solo por Google no tiene password (null): tampoco entra por aqui.
            if (!user || !user.password || !(await comparePassword(password, user.password))) {
                res.status(401).json({ message: 'Credenciales inválidas', error: 'Correo o contraseña incorrectos.' });
                return;
            }

            if (user.status !== 'active') {
                res.status(403).json({ message: 'Usuario inhabilitado', error: 'Tu usuario no está activo, contacta al administrador de tu empresa.' });
                return;
            }

            const session = await AuthController.issueSession(user);

            if (!session) {
                res.status(403).json({ message: 'Empresa no encontrada', error: 'Tu usuario no está vinculado a ninguna empresa.' });
                return;
            }

            res.json({
                token: session.token,
                expires_in: JWT_EXPIRES_IN,
                user,
                role: session.role,
                company: session.company
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Inicia sesion (o vincula la cuenta existente) con un id_token de Google
     * Identity Services. Si el correo verificado por Google no tiene cuenta
     * todavia, no crea nada: devuelve is_new:true para que el frontend siga
     * con el registro de empresa (ver CompanyController.registerCompanyProcess).
     *
     * @static
     * @memberof AuthController
     */
    static async google(req: Request, res: Response, next: NextFunction) {
        try {
            const { id_token } = req.body;

            if (!id_token) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Falta el token de Google.' });
                return;
            }

            let profile;
            try {
                profile = await verifyGoogleToken(id_token);
            } catch {
                res.status(401).json({ message: 'Token inválido', error: 'No pudimos verificar tu cuenta de Google.' });
                return;
            }

            const user = await UserModel.findOne({ where: { email: profile.email } });

            if (!user) {
                res.json({
                    is_new: true,
                    google: {
                        email: profile.email,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        photo_url: profile.photo_url
                    }
                });
                return;
            }

            if (user.status !== 'active') {
                res.status(403).json({ message: 'Usuario inhabilitado', error: 'Tu usuario no está activo, contacta al administrador de tu empresa.' });
                return;
            }

            // Primera vez que este email entra por Google: se vincula la cuenta
            // automaticamente (Google ya verifico que el correo es suyo)
            if (!user.google_id) {
                user.google_id = profile.google_id;
                await user.save();
            }

            const session = await AuthController.issueSession(user);

            if (!session) {
                res.status(403).json({ message: 'Empresa no encontrada', error: 'Tu usuario no está vinculado a ninguna empresa.' });
                return;
            }

            res.json({
                is_new: false,
                token: session.token,
                expires_in: JWT_EXPIRES_IN,
                user,
                role: session.role,
                company: session.company
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Devuelve la sesion actual a partir del token
     *
     * @static
     * @memberof AuthController
     */
    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            const session = (req as any).session;

            const user = await UserModel.findByPk(session.user.uuid);

            if (!user || user.status !== 'active') {
                res.status(401).json({ message: 'Sesión inválida', error: 'Vuelve a iniciar sesión.' });
                return;
            }

            const role = await RoleModel.findByPk(user.role_id);
            const company = await CompanyModel.findByPk(session.company.uuid);

            res.json({ user, role, company });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Cada usuario edita su propio nombre, foto y (opcionalmente) su contraseña.
     *
     * @static
     * @memberof AuthController
     */
    static async updateMe(req: Request, res: Response, next: NextFunction) {
        try {
            const session = (req as any).session;
            const { first_name, middle_name, current_password, new_password, new_password_confirmation } = req.body;

            if (!first_name) {
                res.status(400).json({ message: 'Datos incompletos', error: 'El nombre es requerido.' });
                return;
            }

            const user = await UserModel.findByPk(session.user.uuid);

            if (!user) {
                res.status(401).json({ message: 'Sesión inválida', error: 'Vuelve a iniciar sesión.' });
                return;
            }

            // El cambio (o alta) de contraseña es opcional: solo si el usuario llenó los campos.
            // Una cuenta creada solo por Google no tiene password todavia: ahi no se pide
            // "contraseña actual" para confirmarla, porque no existe ninguna que confirmar.
            if (new_password || current_password || new_password_confirmation) {
                if (user.password) {
                    if (!current_password || !new_password || !new_password_confirmation) {
                        res.status(400).json({ message: 'Datos incompletos', error: 'Completa la contraseña actual y la nueva contraseña para cambiarla.' });
                        return;
                    }

                    if (!(await comparePassword(current_password, user.password))) {
                        res.status(401).json({ message: 'Contraseña incorrecta', error: 'Tu contraseña actual no es correcta.' });
                        return;
                    }
                } else if (!new_password || !new_password_confirmation) {
                    res.status(400).json({ message: 'Datos incompletos', error: 'Completa la nueva contraseña y su confirmación.' });
                    return;
                }

                if (new_password !== new_password_confirmation) {
                    res.status(400).json({ message: 'Contraseña inválida', error: 'La confirmación de la nueva contraseña no coincide.' });
                    return;
                }

                user.password = await hashPassword(new_password);
            }

            user.first_name = first_name;
            user.middle_name = middle_name ?? null;

            const file = (req as any).file;

            if (file) {
                const namePrefix = buildImagePrefix(session.company.tenant_id, session.company.name);
                const { url } = await uploadFile(file, `avatars/${session.company.tenant_id}`, 'webp', { width: 512, height: 512, fit: 'inside' }, namePrefix);
                user.photo_url = url;
            }

            await user.save();

            const role = await RoleModel.findByPk(user.role_id);
            const company = await CompanyModel.findByPk(session.company.uuid);

            res.json({ user, role, company });
        } catch (err) {
            next(err);
        }
    }
}
