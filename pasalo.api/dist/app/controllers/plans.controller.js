"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansController = void 0;
const plans_model_1 = require("../models/plans.model");
class PlansController {
    static async getAllPlans(req, res, next) {
        try {
            const plansList = await plans_model_1.PlanModel.findAll({ raw: true });
            res.json(plansList);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PlansController = PlansController;
