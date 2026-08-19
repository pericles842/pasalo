import { NextFunction, Request, Response } from 'express';
import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

export class OrderStatusController {

    /** Catalogo de estados de orden (vive en la base master) */
    static async listStatuses(req: Request, res: Response, next: NextFunction) {
        try {
            const statuses = await sequelize.query(
                `SELECT * FROM status_orders ORDER BY id ASC`,
                { type: QueryTypes.SELECT }
            );

            res.json(statuses);
        } catch (err) {
            next(err);
        }
    }
}
