"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const company_model_1 = require("../models/company.model");
class CompanyController {
    static parserDomain(domain) {
        if (!domain)
            return '';
        let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').trim();
        let parts = cleanDomain.split('.');
        return parts[0] ? parts[0] : '';
    }
    static async registerCompanyProcess(req, res, next) {
        try {
            let company = req.body;
            let company_plan_id = req.body.plan_id;
            let connection_company;
            company.tenant_id = CompanyController.parserDomain(req.body.domain);
            company = await company_model_1.CompanyModel.create(company);
            connection_company = await company_model_1.CompanyModel.createConnectionCompany(company, company_plan_id);
            res.json({
                company,
                connection_company
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CompanyController = CompanyController;
