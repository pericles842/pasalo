"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatusController = void 0;
const db_1 = require("../config/db");
const sequelize_1 = require("sequelize");
class OrderStatusController {
    /** Catalogo de estados de orden (vive en la base master) */
    static async listStatuses(req, res, next) {
        try {
            const statuses = await db_1.sequelize.query(`SELECT * FROM status_orders ORDER BY id ASC`, { type: sequelize_1.QueryTypes.SELECT });
            res.json(statuses);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OrderStatusController = OrderStatusController;
