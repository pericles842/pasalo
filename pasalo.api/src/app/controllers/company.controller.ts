import { NextFunction, Request, Response } from 'express';
import { PlanModel } from '../models/plans.model';
import { CompanyModel } from '../models/company.model';
import { UserModel } from '../models/user.model';
import { CompanyUserModel } from '../models/company_user.model';
import { ROLE_ADMIN_SLUG, RoleModel } from '../models/role.model';
import { sequelize } from '../config/db';
import { hashPassword } from '../../utils/auth';

export class CompanyController {

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
                rif: company_data.rif,
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
}
