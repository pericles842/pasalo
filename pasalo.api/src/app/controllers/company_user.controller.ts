import { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import { UserModel } from '../models/user.model';
import { ROLE_ADMIN_SLUG, RoleModel } from '../models/role.model';
import { CompanyUserModel } from '../models/company_user.model';
import { CompanyModel } from '../models/company.model';
import { PlanModel } from '../models/plans.model';
import { hashPassword } from '../../utils/auth';
import { SessionPayload } from '../../middlewares/jwtMiddleware';

export class CompanyUserController {

    private static session(req: Request): SessionPayload {
        return (req as any).session as SessionPayload;
    }

    /** Solo el usuario master administra los usuarios de la empresa */
    private static isAdmin(req: Request): boolean {
        return CompanyUserController.session(req).role === 'admin';
    }

    /**
     * Usuarios usados vs. permitidos por el plan de la empresa
     *
     * @static
     * @param {string} company_id
     * @memberof CompanyUserController
     */
    private static async getUsage(company_id: string) {
        const [used] = await sequelize.query<{ total: number }>(
            `SELECT COUNT(*) AS total FROM company_users WHERE company_id = :company_id`,
            { replacements: { company_id }, type: QueryTypes.SELECT }
        );

        const [plan] = await sequelize.query<any>(
            `SELECT p.* FROM companies_subscriptions cs
             JOIN plans p ON p.id = cs.plan_id
             WHERE cs.company_id = :company_id`,
            { replacements: { company_id }, type: QueryTypes.SELECT }
        );

        const limit = plan?.user_limit ?? 0;
        const total = Number(used.total);

        return {
            plan,
            usage: {
                used: total,
                limit,
                available: Math.max(0, limit - total)
            }
        };
    }

    /**
     * Lista los usuarios de la empresa junto con el consumo del plan
     *
     * @static
     * @memberof CompanyUserController
     */
    static async listUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const company_id = CompanyUserController.session(req).company.uuid;

            const users = await sequelize.query(
                `SELECT u.uuid, u.first_name, u.middle_name, u.email, u.photo_url, u.status,
                        u.sales_made, u.createdAt, r.id AS role_id, r.name AS role_name, r.slug AS role_slug
                 FROM company_users cu
                 JOIN users u ON u.uuid = cu.user_id
                 JOIN roles r ON r.id = u.role_id
                 WHERE cu.company_id = :company_id
                 ORDER BY u.createdAt ASC`,
                { replacements: { company_id }, type: QueryTypes.SELECT }
            );

            const { plan, usage } = await CompanyUserController.getUsage(company_id);

            res.json({ users, plan, usage });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Crea un usuario interno. El plan define cuantos caben.
     *
     * @static
     * @memberof CompanyUserController
     */
    static async createUser(req: Request, res: Response, next: NextFunction) {
        if (!CompanyUserController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede crear usuarios.' });
            return;
        }

        const company_id = CompanyUserController.session(req).company.uuid;
        const { first_name, middle_name, password, password_confirmation, role_id } = req.body;

        // El correo es la credencial de acceso: siempre normalizado para que
        // "Ana@Gmail.com" y "ana@gmail.com" sean el mismo usuario
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : null;

        if (!first_name || !email || !password || !role_id) {
            res.status(400).json({ message: 'Datos incompletos', error: 'Completa el cargo, el nombre, el correo y la contraseña.' });
            return;
        }

        if (password !== password_confirmation) {
            res.status(400).json({ message: 'Contraseña inválida', error: 'La confirmación de contraseña no coincide.' });
            return;
        }

        const email_taken = await UserModel.findOne({ where: { email } });

        if (email_taken) {
            res.status(409).json({ message: 'Correo en uso', error: `El correo ${email} ya está registrado en Pásalo, usa otro.` });
            return;
        }

        const { plan, usage } = await CompanyUserController.getUsage(company_id);

        if (usage.available <= 0) {
            res.status(409).json({
                message: 'Límite de usuarios alcanzado',
                error: `Tu ${plan?.name ?? 'plan'} permite ${usage.limit} ${usage.limit === 1 ? 'usuario' : 'usuarios'} y ya los tienes ocupados. Cambia de plan para agregar más.`,
                usage
            });
            return;
        }

        const role = await RoleModel.findByPk(role_id);

        if (!role) {
            res.status(404).json({ message: 'Cargo no encontrado', error: 'El cargo seleccionado no existe.' });
            return;
        }

        if (role.slug === ROLE_ADMIN_SLUG) {
            res.status(400).json({ message: 'Cargo no permitido', error: 'El cargo de administrador es exclusivo del usuario master de la empresa.' });
            return;
        }

        const transaction = await sequelize.transaction();

        try {
            const user = await UserModel.create({
                first_name,
                middle_name: middle_name ?? null,
                photo_url: null,
                ci: null,
                email,
                password: await hashPassword(password),
                role_id: role.id,
                status: 'active',
                // Se calcula solo a partir de las órdenes del usuario; nunca se captura a mano
                sales_made: 0
            }, { transaction });

            await CompanyUserModel.create({
                company_id,
                user_id: user.uuid
            }, { transaction });

            await transaction.commit();

            const refreshed = await CompanyUserController.getUsage(company_id);

            res.status(201).json({ user, role, usage: refreshed.usage });
        } catch (err) {
            await transaction.rollback();
            next(err);
        }
    }

    /**
     * Cambia el plan de la empresa y con el, el limite de usuarios
     *
     * @static
     * @memberof CompanyUserController
     */
    static async changePlan(req: Request, res: Response, next: NextFunction) {
        if (!CompanyUserController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede cambiar el plan.' });
            return;
        }

        try {
            const company_id = CompanyUserController.session(req).company.uuid;
            const { plan_id } = req.body;

            const plan = await PlanModel.findByPk(plan_id);

            if (!plan) {
                res.status(404).json({ message: 'Plan no encontrado', error: 'El plan seleccionado no existe.' });
                return;
            }

            const { usage } = await CompanyUserController.getUsage(company_id);

            // No se puede bajar a un plan mas chico que la cantidad de usuarios ya creados
            if (plan.user_limit < usage.used) {
                res.status(409).json({
                    message: 'Plan insuficiente',
                    error: `Tienes ${usage.used} usuarios y el ${plan.name} solo permite ${plan.user_limit}. Elimina usuarios antes de bajar de plan.`,
                    usage
                });
                return;
            }

            await sequelize.transaction(async (transaction) => {
                await sequelize.query(
                    `UPDATE companies_subscriptions SET plan_id = :plan_id, updatedAt = NOW() WHERE company_id = :company_id`,
                    { replacements: { plan_id: plan.id, company_id }, transaction }
                );

                await CompanyModel.update(
                    { user_limit: plan.user_limit },
                    { where: { uuid: company_id }, transaction }
                );
            });

            const refreshed = await CompanyUserController.getUsage(company_id);

            res.json({ plan, usage: refreshed.usage });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Cargos disponibles para los usuarios de la empresa
     *
     * @static
     * @memberof CompanyUserController
     */
    static async listRoles(req: Request, res: Response, next: NextFunction) {
        try {
            // El cargo de administrador no se asigna: es del usuario master que registró la empresa
            const roles = await RoleModel.findAll({
                where: { slug: { [Op.ne]: ROLE_ADMIN_SLUG } },
                order: [['id', 'ASC']]
            });

            res.json(roles);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Elimina un usuario interno de la empresa.
     * El usuario master no puede eliminarse a si mismo desde aqui.
     *
     * @static
     * @memberof CompanyUserController
     */
    static async deleteUser(req: Request, res: Response, next: NextFunction) {
        if (!CompanyUserController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede eliminar usuarios.' });
            return;
        }

        try {
            const session = CompanyUserController.session(req);
            const company_id = session.company.uuid;
            const { uuid } = req.params;

            if (uuid === session.user.uuid) {
                res.status(400).json({ message: 'Operación no permitida', error: 'No puedes eliminar tu propio usuario administrador.' });
                return;
            }

            // Confirma que el usuario pertenece a la empresa de quien hace la peticion
            const link = await CompanyUserModel.findOne({ where: { company_id, user_id: uuid } });

            if (!link) {
                res.status(404).json({ message: 'Usuario no encontrado', error: 'Ese usuario no pertenece a tu empresa.' });
                return;
            }

            // company_users se elimina en cascada por la FK hacia users
            await UserModel.destroy({ where: { uuid } });

            const { usage } = await CompanyUserController.getUsage(company_id);

            res.json({ message: 'Usuario eliminado', usage });
        } catch (err) {
            next(err);
        }
    }
}
