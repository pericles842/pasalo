"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsController = void 0;
const adsEngine_1 = require("../../utils/adsEngine");
const ad_location_model_1 = require("../models/ad_location.model");
const plans_ads_model_1 = require("../models/plans_ads.model");
class AdsController {
    static async getAdForPlacement(req, res, next) {
        try {
            const placement = req.params.placement;
            const ad = await (0, adsEngine_1.getAdForPlacement)(placement);
            if (!ad) {
                res.status(204).send();
                return;
            }
            res.json(ad);
        }
        catch (err) {
            next(err);
        }
    }
    static async registerClick(req, res, next) {
        try {
            const id = Number(req.params.id);
            const ok = await (0, adsEngine_1.registerAdClick)(id);
            if (!ok) {
                res.status(404).json({ message: 'Anuncio no encontrado' });
                return;
            }
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
    static async getPlans(req, res, next) {
        try {
            const plans = await plans_ads_model_1.PlanAdsModel.findAll({
                where: { status: 'active' },
                include: [{ model: ad_location_model_1.AdLocationModel, as: 'locations', attributes: ['id', 'key', 'name'], through: { attributes: [] } }]
            });
            res.json(plans);
        }
        catch (err) {
            next(err);
        }
    }
    /** Catalogo de ubicaciones disponibles, para armar planes nuevos o dar de alta un anuncio a mano */
    static async getLocations(req, res, next) {
        try {
            const locations = await ad_location_model_1.AdLocationModel.findAll({ where: { status: 'active' }, raw: true });
            res.json(locations);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdsController = AdsController;
