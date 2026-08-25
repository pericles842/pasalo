import { NextFunction, Request, Response } from 'express';
import { getAdForPlacement, registerAdClick } from '../../utils/adsEngine';
import { AdPlacement } from '../models/plans_ads.model';
import { PlanAdsModel } from '../models/plans_ads.model';

const VALID_PLACEMENTS: AdPlacement[] = ['header', 'footer', 'sidebar', 'dashboard_static', 'modal'];

export class AdsController {
    static async getAdForPlacement(req: Request, res: Response, next: NextFunction) {
        try {
            const placement = req.params.placement as AdPlacement;
            if (!VALID_PLACEMENTS.includes(placement)) {
                res.status(400).json({ message: 'Placement inválido' });
                return;
            }

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
            const plans = await PlanAdsModel.findAll({ where: { status: 'active' }, raw: true });
            res.json(plans);
        } catch (err) {
            next(err);
        }
    }
}
