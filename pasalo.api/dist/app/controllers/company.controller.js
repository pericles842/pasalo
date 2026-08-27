"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const sequelize_1 = require("sequelize");
const plans_model_1 = require("../models/plans.model");
const company_model_1 = require("../models/company.model");
const user_model_1 = require("../models/user.model");
const company_user_model_1 = require("../models/company_user.model");
const role_model_1 = require("../models/role.model");
const db_1 = require("../config/db");
const auth_1 = require("../../utils/auth");
const storage_1 = require("../../utils/storage");
class CompanyController {
    static session(req) {
        return req.session;
    }
    /** Solo el usuario master edita los datos de la empresa */
    static isAdmin(req) {
        return CompanyController.session(req).role === 'admin';
    }
    static parserDomain(domain) {
        if (!domain)
            return '';
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
    static async registerCompanyProcess(req, res, next) {
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
        const plan = await plans_model_1.PlanModel.findByPk(plan_id);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', error: 'El plan seleccionado no existe.' });
            return;
        }
        // Un plan pago no se activa solo: la empresa nace en el gratuito y el
        // pedido queda pendiente de verificación (ver CompanyModel.createSubscription)
        const is_free_plan = Number(plan.price) === 0;
        const starting_plan = is_free_plan ? plan : await plans_model_1.PlanModel.findByPk(1);
        if (!starting_plan) {
            res.status(500).json({ message: 'Plan gratuito no encontrado', error: 'El plan gratuito no está cargado en la base de datos.' });
            return;
        }
        const admin_role = await role_model_1.RoleModel.findBySlug(role_model_1.ROLE_ADMIN_SLUG);
        if (!admin_role) {
            res.status(500).json({ message: 'Rol no encontrado', error: 'El rol de administrador no está cargado en la base de datos.' });
            return;
        }
        const transaction = await db_1.sequelize.transaction();
        let company;
        let user;
        try {
            company = await company_model_1.CompanyModel.create({
                name: company_data.name,
                // Vacio se guarda como null: con unique:true, dos empresas con
                // rif:'' chocarian entre si, pero varias con null no
                rif: company_data.rif?.trim() || null,
                email: company_data.email,
                domain: company_data.domain,
                logo_url: company_data.logo ?? null,
                tenant_id,
                // El plan manda: define cuántos usuarios internos puede crear el master.
                // Si el plan pedido es pago, todavía no está activo: se usa el del gratuito
                user_limit: starting_plan.user_limit
            }, { transaction });
            // El usuario que registra la empresa siempre es el administrador
            user = await user_model_1.UserModel.create({
                first_name: user_data.first_name,
                middle_name: user_data.middle_name ?? null,
                photo_url: user_data.photo_url ?? null,
                ci: user_data.ci,
                email: user_data.email,
                password: await (0, auth_1.hashPassword)(user_data.password),
                role_id: admin_role.id,
                status: 'active'
            }, { transaction });
            await company_user_model_1.CompanyUserModel.create({
                company_id: company.uuid,
                user_id: user.uuid
            }, { transaction });
            var subscription = await company_model_1.CompanyModel.createSubscription(company, plan, transaction);
            await transaction.commit();
        }
        catch (err) {
            await transaction.rollback();
            next(err);
            return;
        }
        // La base de datos de la compañía se crea fuera de la transacción:
        // MySQL hace commit implícito con sentencias DDL.
        try {
            await company_model_1.CompanyModel.createConnectionCompany(company);
        }
        catch (err) {
            await company_model_1.CompanyModel.dropConnectionCompany(company.tenant_id);
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
    static async updateCompany(req, res, next) {
        if (!CompanyController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede editar los datos de la empresa.' });
            return;
        }
        try {
            const session = CompanyController.session(req);
            const { name, domain, link_expiration_minutes } = req.body;
            if (!name || !domain) {
                res.status(400).json({ message: 'Datos incompletos', error: 'El nombre y el dominio de la empresa son requeridos.' });
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
            const company = await company_model_1.CompanyModel.findByPk(session.company.uuid);
            if (!company) {
                res.status(404).json({ message: 'Empresa no encontrada', error: 'Tu empresa no existe.' });
                return;
            }
            // Vacio se guarda como null: con unique:true, dos empresas con rif:'' chocarian entre si, pero varias con null no
            const rif = typeof req.body.rif === 'string' ? req.body.rif.trim() || null : null;
            if (rif) {
                const rif_taken = await company_model_1.CompanyModel.findOne({ where: { rif, uuid: { [sequelize_1.Op.ne]: company.uuid } } });
                if (rif_taken) {
                    res.status(409).json({ message: 'RIF en uso', error: `El RIF ${rif} ya está registrado en Pásalo, verifica los datos.` });
                    return;
                }
            }
            company.name = name;
            company.rif = rif;
            company.domain = domain;
            if (link_expiration_minutes !== undefined)
                company.link_expiration_minutes = Number(link_expiration_minutes);
            const file = req.file;
            if (file) {
                const { url } = await (0, storage_1.uploadFile)(file, `logos/${company.tenant_id}`, 'webp', { width: 512, height: 512, fit: 'inside' });
                company.logo_url = url;
            }
            await company.save();
            const user = await user_model_1.UserModel.findByPk(session.user.uuid);
            const role = await role_model_1.RoleModel.findByPk(user.role_id);
            res.json({ user, role, company });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CompanyController = CompanyController;
