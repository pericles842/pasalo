import { NextFunction, Request, Response } from 'express';
import { TestResponse } from '../interfaces/test';
import { TestModel } from '../models/test.model';
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
