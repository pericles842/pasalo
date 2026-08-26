import { NextFunction, Request, Response } from 'express';
import { getAdForPlacement, registerAdClick } from '../../utils/adsEngine';
import { AdLocationModel } from '../models/ad_location.model';
import { PlanAdsModel } from '../models/plans_ads.model';

export class AdsController {
    static async getAdForPlacement(req: Request, res: Response, next: NextFunction) {
        try {
            const placement = req.params.placement as string;

            const ad = await getAdForPlacement(placement);
            if (!ad) {
                res.status(204).send();
                return;
            }

            res.json(ad);
        } catch (err) {
            next(err);
        }
    }

    static async registerClick(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const ok = await registerAdClick(id);
            if (!ok) {
                res.status(404).json({ message: 'Anuncio no encontrado' });
                return;
            }

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }

    static async getPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await PlanAdsModel.findAll({
                where: { status: 'active' },
                include: [{ model: AdLocationModel, as: 'locations', attributes: ['id', 'key', 'name'], through: { attributes: [] } }]
            });
            res.json(plans);
        } catch (err) {
            next(err);
        }
    }

    /** Catalogo de ubicaciones disponibles, para armar planes nuevos o dar de alta un anuncio a mano */
    static async getLocations(req: Request, res: Response, next: NextFunction) {
        try {
            const locations = await AdLocationModel.findAll({ where: { status: 'active' }, raw: true });
            res.json(locations);
        } catch (err) {
            next(err);
        }
    }
}
