"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdForPlacement = getAdForPlacement;
exports.registerAdClick = registerAdClick;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const ads_model_1 = require("../app/models/ads.model");
const ad_location_model_1 = require("../app/models/ad_location.model");
const plans_ads_model_1 = require("../app/models/plans_ads.model");
const awsBucketS3_1 = require("./awsBucketS3");
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
/** Mismo criterio que storage.ts: con las 3 variables presentes, se lee de S3 en vez de disco */
function isS3Configured() {
    return !!(process.env.AWS_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}
// Sortea un elemento de la lista con probabilidad proporcional a su priority (1-10).
// No es un ranking fijo: uno de priority baja igual puede salir, solo que menos seguido.
function weightedPick(items) {
    if (items.length === 0)
        return null;
    const total = items.reduce((sum, item) => sum + item.priority, 0);
    if (total <= 0)
        return items[Math.floor(Math.random() * items.length)];
    let roll = Math.random() * total;
    for (const item of items) {
        roll -= item.priority;
        if (roll <= 0)
            return item;
    }
    return items[items.length - 1];
}
/**
 * Devuelve la url publica de una foto al azar dentro de la carpeta de la empresa
 * (`folder_name`, ej. "ads-coffeecode"). Lee de S3 si esta configurado, si no de
 * /uploads en disco — mismo switch transparente que ya usa storage.ts.
 */
async function pickRandomImageUrl(folderName) {
    if (isS3Configured()) {
        try {
            const objects = await (0, awsBucketS3_1.listFiles)(folderName);
            const images = objects.filter((o) => o.Key && IMAGE_EXTENSIONS.has(path_1.default.extname(o.Key).toLowerCase()));
            if (images.length === 0)
                return null;
            const picked = images[Math.floor(Math.random() * images.length)];
            return (0, awsBucketS3_1.getPublicUrl)(picked.Key);
        }
        catch {
            return null;
        }
    }
    try {
        const files = await promises_1.default.readdir(path_1.default.join(UPLOADS_DIR, folderName));
        const images = files.filter((f) => IMAGE_EXTENSIONS.has(path_1.default.extname(f).toLowerCase()));
        if (images.length === 0)
            return null;
        const picked = images[Math.floor(Math.random() * images.length)];
        const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
        return `${base}/uploads/${folderName}/${picked}`;
    }
    catch {
        return null;
    }
}
/**
 * Elige un anuncio activo para la ubicacion pedida (`ad_locations.key`): sorteo
 * ponderado por priority entre los ads vigentes (status active, dentro de
 * start_date/end_date, y cuyo plan incluya esa ubicacion), y dentro de ese ad,
 * una foto al azar entre las que haya en su carpeta. Si la carpeta ganadora no
 * tiene fotos, se descarta y se vuelve a sortear entre el resto.
 */
async function getAdForPlacement(placement) {
    const today = new Date().toISOString().slice(0, 10);
    const candidates = await ads_model_1.AdModel.findAll({
        where: {
            status: 'active',
            start_date: { [sequelize_1.Op.lte]: today },
            end_date: { [sequelize_1.Op.gte]: today }
        },
        include: [
            {
                model: plans_ads_model_1.PlanAdsModel,
                as: 'plan',
                required: true,
                attributes: [],
                include: [
                    {
                        model: ad_location_model_1.AdLocationModel,
                        as: 'locations',
                        required: true,
                        attributes: [],
                        through: { attributes: [] },
                        where: { key: placement, status: 'active' }
                    }
                ]
            }
        ]
    });
    let pool = [...candidates];
    while (pool.length > 0) {
        const chosen = weightedPick(pool);
        if (!chosen)
            break;
        const image_url = await pickRandomImageUrl(chosen.folder_name);
        if (image_url) {
            await ads_model_1.AdModel.increment('impressions_count', { where: { id: chosen.id } });
            return {
                id: chosen.id,
                company_name: chosen.company_name,
                target_url: chosen.target_url,
                placement,
                image_url,
                interval_seconds: chosen.interval_seconds
            };
        }
        pool = pool.filter((c) => c.id !== chosen.id);
    }
    return null;
}
async function registerAdClick(adId) {
    const ad = await ads_model_1.AdModel.findByPk(adId);
    if (!ad)
        return false;
    await ad.increment('clicks_count');
    return true;
}
