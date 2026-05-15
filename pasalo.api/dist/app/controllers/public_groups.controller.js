"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicGroupsController = void 0;
const public_groups_model_1 = require("../models/public_groups.model");
class PublicGroupsController {
    /**
     *Lista todas las cajas de ahorro
     *
     * @static
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @memberof PublicGroupsController
     */
    static async getPublicGroups(req, res, next) {
        try {
            const groups = await public_groups_model_1.PublicGroupsModel.findAll();
            res.json(groups);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PublicGroupsController = PublicGroupsController;
