import fs from 'fs/promises';
import path from 'path';
import { Op } from 'sequelize';
import { AdModel } from '../app/models/ads.model';
import { AdPlacement } from '../app/models/plans_ads.model';
import { getPublicUrl, listFiles } from './awsBucketS3';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

/** Mismo criterio que storage.ts: con las 3 variables presentes, se lee de S3 en vez de disco */
function isS3Configured(): boolean {
    return !!(process.env.AWS_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export interface AdPayload {
    id: number;
    company_name: string;
    target_url: string;
    placement: AdPlacement;
    image_url: string;
    interval_seconds: number | null;
}

// Sortea un elemento de la lista con probabilidad proporcional a su priority (1-10).
// No es un ranking fijo: uno de priority baja igual puede salir, solo que menos seguido.
function weightedPick<T extends { priority: number }>(items: T[]): T | null {
    if (items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + item.priority, 0);
    if (total <= 0) return items[Math.floor(Math.random() * items.length)];

    let roll = Math.random() * total;
    for (const item of items) {
        roll -= item.priority;
        if (roll <= 0) return item;
    }

    return items[items.length - 1];
}

/**
 * Devuelve la url publica de una foto al azar dentro de la carpeta de la empresa
 * (`folder_name`, ej. "ads-coffeecode"). Lee de S3 si esta configurado, si no de
 * /uploads en disco — mismo switch transparente que ya usa storage.ts.
 */
async function pickRandomImageUrl(folderName: string): Promise<string | null> {
    if (isS3Configured()) {
        try {
            const objects = await listFiles(folderName);
            const images = objects.filter((o) => o.Key && IMAGE_EXTENSIONS.has(path.extname(o.Key).toLowerCase()));
            if (images.length === 0) return null;

            const picked = images[Math.floor(Math.random() * images.length)];
            return getPublicUrl(picked.Key!);
        } catch {
            return null;
        }
    }

    try {
        const files = await fs.readdir(path.join(UPLOADS_DIR, folderName));
        const images = files.filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
        if (images.length === 0) return null;

        const picked = images[Math.floor(Math.random() * images.length)];
        const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
        return `${base}/uploads/${folderName}/${picked}`;
    } catch {
        return null;
    }
}

/**
 * Elige un anuncio activo para el placement pedido: sorteo ponderado por priority
 * entre los ads vigentes (status active y dentro de start_date/end_date), y dentro
 * de ese ad, una foto al azar entre las que haya en su carpeta. Si la carpeta
 * ganadora no tiene fotos, se descarta y se vuelve a sortear entre el resto.
 */
export async function getAdForPlacement(placement: AdPlacement): Promise<AdPayload | null> {
    const today = new Date().toISOString().slice(0, 10);

    const candidates = await AdModel.findAll({
        where: {
            placement,
            status: 'active',
            start_date: { [Op.lte]: today },
            end_date: { [Op.gte]: today }
        },
        raw: true
    });

    let pool = [...candidates];

    while (pool.length > 0) {
        const chosen = weightedPick(pool);
        if (!chosen) break;

        const image_url = await pickRandomImageUrl(chosen.folder_name);
        if (image_url) {
            await AdModel.increment('impressions_count', { where: { id: chosen.id } });

            return {
                id: chosen.id,
                company_name: chosen.company_name,
                target_url: chosen.target_url,
                placement: chosen.placement,
                image_url,
                interval_seconds: chosen.interval_seconds
            };
        }

        pool = pool.filter((c) => c.id !== chosen.id);
    }

    return null;
}

export async function registerAdClick(adId: number): Promise<boolean> {
    const ad = await AdModel.findByPk(adId);
    if (!ad) return false;

    await ad.increment('clicks_count');
    return true;
}
