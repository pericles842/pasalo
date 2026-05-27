import { NextFunction, Request, Response } from 'express';
import { PlanModel } from '../models/plans.model';
import { CompanyModel } from '../models/company.model';

export class CompanyController {

    private static parserDomain(domain: string): string {
        if (!domain) return '';
        let cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').trim();

        let parts = cleanDomain.split('.');
        return parts[0] ? parts[0] : '';
    }
    static async registerCompanyProcess(req: Request, res: Response, next: NextFunction) {
        try {
            let company = req.body;
            let company_plan_id = req.body.plan_id;
            let connection_company
            company.tenant_id = CompanyController.parserDomain(req.body.domain);
            company = await CompanyModel.create(company);
            connection_company = await CompanyModel.createConnectionCompany(company, company_plan_id);


            res.json({
                company,
                connection_company
            });
        } catch (err) {
            next(err);
        }
    }
}
