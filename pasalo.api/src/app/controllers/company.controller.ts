import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { PlanModel } from '../models/plans.model';
import { CompanyModel } from '../models/company.model';
import { UserModel } from '../models/user.model';
import { CompanyUserModel } from '../models/company_user.model';
import { ROLE_ADMIN_SLUG, RoleModel } from '../models/role.model';
import { sequelize } from '../config/db';
import { hashPassword } from '../../utils/auth';
import { uploadFile } from '../../utils/storage';
import { SessionPayload } from '../../middlewares/jwtMiddleware';

export class CompanyController {

    private static session(req: Request): SessionPayload {
        return (req as any).session as SessionPayload;
    }

    /** Solo el usuario master edita los datos de la empresa */
    private static isAdmin(req: Request): boolean {
        return CompanyController.session(req).role === 'admin';
    }

    private static parserDomain(domain: string): string {
        if (!domain) return '';
        let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').trim();

        let parts = cleanDomain.split('.');
        return parts[0] ? parts[0] : '';
    }

    /**
     * Registra la empresa, su usuario master y la suscripción al plan.
     * El límite de usuarios internos lo define el plan seleccionado.
     *
     * @static
     * @memberof CompanyController
     */
    static async registerCompanyProcess(req: Request, res: Response, next: NextFunction) {
        const { company: company_data, user: user_data, plan_id } = req.body;

        if (!company_data || !user_data) {
            res.status(400).json({ message: 'Datos incompletos', error: 'Debes enviar los datos de la empresa y del usuario master.' });
            return;
        }

        if (user_data.password !== user_data.password_confirmation) {
            res.status(400).json({ message: 'Contraseña inválida', error: 'La confirmación de contraseña no coincide.' });
            return;
        }

        const tenant_id = CompanyController.parserDomain(company_data.domain);

        if (!tenant_id) {
            res.status(400).json({ message: 'Dominio inválido', error: 'No se pudo generar el identificador de la empresa a partir del dominio.' });
            return;
        }

        const plan = await PlanModel.findByPk(plan_id);

        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', error: 'El plan seleccionado no existe.' });
            return;
        }

        const admin_role = await RoleModel.findBySlug(ROLE_ADMIN_SLUG);

        if (!admin_role) {
            res.status(500).json({ message: 'Rol no encontrado', error: 'El rol de administrador no está cargado en la base de datos.' });
            return;
        }

        const transaction = await sequelize.transaction();
        let company: CompanyModel;
        let user: UserModel;

        try {
            company = await CompanyModel.create({
                name: company_data.name,
                // Vacio se guarda como null: con unique:true, dos empresas con
                // rif:'' chocarian entre si, pero varias con null no
                rif: company_data.rif?.trim() || null,
                email: company_data.email,
                domain: company_data.domain,
                logo_url: company_data.logo ?? null,
                tenant_id,
                // El plan manda: define cuántos usuarios internos puede crear el master
                user_limit: plan.user_limit
            }, { transaction });

            // El usuario que registra la empresa siempre es el administrador
            user = await UserModel.create({
                first_name: user_data.first_name,
                middle_name: user_data.middle_name ?? null,
                photo_url: user_data.photo_url ?? null,
                ci: user_data.ci,
                email: user_data.email,
                password: await hashPassword(user_data.password),
                role_id: admin_role.id,
                status: 'active'
            }, { transaction });

            await CompanyUserModel.create({
                company_id: company.uuid,
                user_id: user.uuid
            }, { transaction });

            var subscription = await CompanyModel.createSubscription(company, plan.id, transaction);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            next(err);
            return;
        }

        // La base de datos de la compañía se crea fuera de la transacción:
        // MySQL hace commit implícito con sentencias DDL.
        try {
            await CompanyModel.createConnectionCompany(company);
        } catch (err) {
            await CompanyModel.dropConnectionCompany(company.tenant_id);
            await company.destroy();
            await user.destroy();
            next(err);
            return;
        }

        res.status(201).json({
            company,
            user,
            subscription,
            plan
        });
    }

    /**
     * Edita nombre, RIF, dominio y logo de la empresa. Solo el usuario master.
     *
     * @static
     * @memberof CompanyController
     */
    static async updateCompany(req: Request, res: Response, next: NextFunction) {
        if (!CompanyController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede editar los datos de la empresa.' });
            return;
        }

        try {
            const session = CompanyController.session(req);
            const { name, domain } = req.body;

            if (!name || !domain) {
                res.status(400).json({ message: 'Datos incompletos', error: 'El nombre y el dominio de la empresa son requeridos.' });
                return;
            }

            const company = await CompanyModel.findByPk(session.company.uuid);

            if (!company) {
                res.status(404).json({ message: 'Empresa no encontrada', error: 'Tu empresa no existe.' });
                return;
            }

            // Vacio se guarda como null: con unique:true, dos empresas con rif:'' chocarian entre si, pero varias con null no
            const rif = typeof req.body.rif === 'string' ? req.body.rif.trim() || null : null;

            if (rif) {
                const rif_taken = await CompanyModel.findOne({ where: { rif, uuid: { [Op.ne]: company.uuid } } });

                if (rif_taken) {
                    res.status(409).json({ message: 'RIF en uso', error: `El RIF ${rif} ya está registrado en Pásalo, verifica los datos.` });
                    return;
                }
            }

            company.name = name;
            company.rif = rif;
            company.domain = domain;

            const file = (req as any).file;

            if (file) {
                const { url } = await uploadFile(file, `logos/${company.tenant_id}`, 'webp', { width: 512, height: 512, fit: 'inside' });
                company.logo_url = url;
            }

            await company.save();

            const user = await UserModel.findByPk(session.user.uuid);
            const role = await RoleModel.findByPk(user!.role_id);

            res.json({ user, role, company });
        } catch (err) {
            next(err);
        }
    }
}
