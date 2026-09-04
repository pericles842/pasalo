import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { PlanModel } from '../models/plans.model';
import { CompanyModel } from '../models/company.model';
import { UserModel } from '../models/user.model';
import { CompanyUserModel } from '../models/company_user.model';
import { ROLE_ADMIN_SLUG, RoleModel } from '../models/role.model';
import { sequelize } from '../config/db';
import { hashPassword } from '../../utils/auth';
import { GoogleProfile, verifyGoogleToken } from '../../utils/googleAuth';
import { uploadFile } from '../../utils/storage';
import { buildImagePrefix, slugify } from '../../utils/fileNaming';
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
        let base = parts[0] ? parts[0] : '';
        return slugify(base);
    }

    /** Si el slug base ya esta en uso, le agrega un sufijo numerico hasta que sea unico */
    private static async uniqueTenantId(base: string): Promise<string> {
        let candidate = base;
        let suffix = 2;

        while (await CompanyModel.findOne({ where: { tenant_id: candidate } })) {
            candidate = `${base}_${suffix}`;
            suffix++;
        }

        return candidate;
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

        // Dos caminos para el usuario master: con contraseña (formulario de siempre)
        // o con Google ("Continuar con Google" en register-company, ver AuthController.google
        // que ya confirmo del lado del frontend que ese correo todavia no tiene cuenta).
        // El id_token se vuelve a verificar aca: nunca se confia en datos ya "verificados"
        // que solo paso el cliente.
        let google_profile: GoogleProfile | null = null;

        if (user_data.id_token) {
            try {
                google_profile = await verifyGoogleToken(user_data.id_token);
            } catch {
                res.status(401).json({ message: 'Token inválido', error: 'No pudimos verificar tu cuenta de Google.' });
                return;
            }

            const existing_user = await UserModel.findOne({ where: { email: google_profile.email } });

            if (existing_user) {
                res.status(409).json({ message: 'Correo en uso', error: 'Ya existe una cuenta con ese correo. Inicia sesión en su lugar.' });
                return;
            }
        } else if (user_data.password !== user_data.password_confirmation) {
            res.status(400).json({ message: 'Contraseña inválida', error: 'La confirmación de contraseña no coincide.' });
            return;
        }

        const domain = typeof company_data.domain === 'string' ? company_data.domain.trim() : '';
        let base_tenant_id: string;

        if (domain) {
            base_tenant_id = CompanyController.parserDomain(domain);

            if (!base_tenant_id) {
                res.status(400).json({ message: 'Dominio inválido', error: 'El dominio no tiene un formato válido.' });
                return;
            }
        } else {
            // Sin dominio, el tenant_id sale del nombre de la empresa. Dos empresas
            // distintas pueden compartir el mismo nombre (ej. "Coffee Code"), asi que
            // se agrega un numero al slug para reducir la probabilidad de colision
            const name_slug = slugify(company_data.name ?? '');

            if (!name_slug) {
                res.status(400).json({ message: 'Nombre inválido', error: 'No se pudo generar el identificador de la empresa a partir del nombre.' });
                return;
            }

            const random_suffix = Math.floor(1000 + Math.random() * 9000);
            base_tenant_id = `${name_slug}_${random_suffix}`;
        }

        const tenant_id = await CompanyController.uniqueTenantId(base_tenant_id);

        const plan = await PlanModel.findByPk(plan_id);

        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', error: 'El plan seleccionado no existe.' });
            return;
        }

        // Un plan pago no se activa solo: la empresa nace en el gratuito y el
        // pedido queda pendiente de verificación (ver CompanyModel.createSubscription)
        const is_free_plan = Number(plan.price) === 0;
        const starting_plan = is_free_plan ? plan : await PlanModel.findByPk(1);

        if (!starting_plan) {
            res.status(500).json({ message: 'Plan gratuito no encontrado', error: 'El plan gratuito no está cargado en la base de datos.' });
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
                // Vacio se guarda como null por la misma razon que el rif: con
                // unique:true, dos empresas con email:'' chocarian, con null no
                email: company_data.email?.trim() || null,
                domain: domain || null,
                logo_url: company_data.logo ?? null,
                tenant_id,
                // El plan manda: define cuántos usuarios internos puede crear el master.
                // Si el plan pedido es pago, todavía no está activo: se usa el del gratuito
                user_limit: starting_plan.user_limit
            }, { transaction });

            // El usuario que registra la empresa siempre es el administrador.
            // Con Google, el cliente pudo editar nombre/apellido/cedula en el paso
            // "Usuario" (el correo llega deshabilitado en ese formulario, pero un
            // request armado a mano igual podria mandar otro): el email SIEMPRE es
            // el que ya verifico Google, nunca el que venga en user_data.
            user = await UserModel.create(google_profile ? {
                first_name: user_data.first_name || google_profile.first_name,
                middle_name: user_data.middle_name ?? (google_profile.last_name || null),
                photo_url: user_data.photo_url ?? google_profile.photo_url,
                ci: user_data.ci ?? null,
                email: google_profile.email,
                password: null,
                google_id: google_profile.google_id,
                role_id: admin_role.id,
                status: 'active'
            } : {
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

            var subscription = await CompanyModel.createSubscription(company, plan, transaction);

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
            const { name, link_expiration_minutes, default_rate_type, required_buyer_fields } = req.body;
            const domain = typeof req.body.domain === 'string' ? req.body.domain.trim() : '';

            if (!name) {
                res.status(400).json({ message: 'Datos incompletos', error: 'El nombre de la empresa es requerido.' });
                return;
            }

            if (domain && !CompanyController.parserDomain(domain)) {
                res.status(400).json({ message: 'Dominio inválido', error: 'El dominio no tiene un formato válido.' });
                return;
            }

            // Duracion del link publico de pago: 1 minuto a 2h (120 min)
            if (link_expiration_minutes !== undefined) {
                const minutes = Number(link_expiration_minutes);

                if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
                    res.status(400).json({
                        message: 'Duración inválida',
                        error: 'La duración del link de pago debe ser entre 1 y 120 minutos.'
                    });
                    return;
                }
            }

            if (default_rate_type !== undefined && !['bcv', 'eur', 'promedio'].includes(default_rate_type)) {
                res.status(400).json({
                    message: 'Tasa inválida',
                    error: 'La tasa por defecto debe ser bcv, eur o promedio.'
                });
                return;
            }

            const ALLOWED_BUYER_FIELDS = ['first_name', 'last_name', 'email', 'ci', 'phone', 'address'];
            let parsed_required_fields: string[] | undefined;

            if (required_buyer_fields !== undefined) {
                try {
                    parsed_required_fields = typeof required_buyer_fields === 'string'
                        ? JSON.parse(required_buyer_fields)
                        : required_buyer_fields;
                } catch {
                    parsed_required_fields = undefined;
                }

                const is_valid = Array.isArray(parsed_required_fields)
                    && parsed_required_fields.every((f) => ALLOWED_BUYER_FIELDS.includes(f));

                if (!is_valid) {
                    res.status(400).json({
                        message: 'Campos inválidos',
                        error: 'Los campos obligatorios del comprador no son válidos.'
                    });
                    return;
                }
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
            company.domain = domain || null;
            if (link_expiration_minutes !== undefined) company.link_expiration_minutes = Number(link_expiration_minutes);
            if (default_rate_type !== undefined) company.default_rate_type = default_rate_type;
            if (parsed_required_fields !== undefined) company.required_buyer_fields = parsed_required_fields;

            const file = (req as any).file;

            if (file) {
                const namePrefix = buildImagePrefix(company.tenant_id, company.name);
                const { url } = await uploadFile(file, `logos/${company.tenant_id}`, 'webp', { width: 512, height: 512, fit: 'inside' }, namePrefix);
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
