"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatesController = void 0;
const states_model_1 = require("../models/states.model");
class StatesController {
    static async getStates(req, res, next) {
        try {
            const roles = await states_model_1.States.getStates();
            res.json(roles);
        }
        catch (err) {
            next(err);
        }
    }
    static async getMunicipalities(req, res, next) {
        try {
            const roles = await states_model_1.States.getMunicipalities(parseInt(req.params.id_state));
            res.json(roles);
        }
        catch (err) {
            next(err);
        }
    }
    static async getParishes(req, res, next) {
        try {
            const roles = await states_model_1.States.getParishes(parseInt(req.params.id_city));
            res.json(roles);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StatesController = StatesController;
