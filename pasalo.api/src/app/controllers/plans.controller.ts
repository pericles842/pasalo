import { NextFunction, Request, Response } from 'express';
import { PlanModel } from '../models/plans.model';

export class PlansController {
    static async getAllPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plansList = await PlanModel.findAll({ raw: true });
            res.json(plansList);
        } catch (err) {
            next(err);
        }
    }
}
