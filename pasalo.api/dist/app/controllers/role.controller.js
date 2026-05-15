"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const role_model_1 = require("../models/role.model");
class RoleController {
    static async getRoles(req, res, next) {
        try {
            const roles = await role_model_1.Role.findAll();
            res.json(roles);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RoleController = RoleController;
