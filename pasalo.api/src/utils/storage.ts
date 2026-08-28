import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { optimizeImage, ResizeOptions } from './ImageOptimize';
import { uploadToS3 } from './awsBucketS3';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/** Cuando estas variables existan, el mismo código sube a S3 en vez de a disco */
function isS3Configured(): boolean {
    return !!(process.env.AWS_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Guarda un archivo (comprobantes, logos, fotos) y devuelve su key y su url publica.
 * Hoy escribe a disco; en cuanto se configuren las variables de AWS_*, sube a S3
 * sin tocar el código que la llama: la firma es identica a uploadToS3().
 *
 * @export
 * @param {*} file
 * @param {string} folder
 * @param {('png' | 'jpg' | 'webp')} [format]
 * @param {ResizeOptions} [resize]
 */
export async function uploadFile(
    file: any,
    folder: string,
    format?: 'png' | 'jpg' | 'webp',
    resize?: ResizeOptions,
    namePrefix?: string
): Promise<{ key: string; url: string }> {
    if (isS3Configured()) {
        return uploadToS3(file, folder, undefined, format, resize, namePrefix);
    }

    return uploadToLocal(file, folder, format, resize, namePrefix);
}

async function uploadToLocal(
    file: any,
    folder: string,
    format?: 'png' | 'jpg' | 'webp',
    resize?: ResizeOptions,
    namePrefix?: string
): Promise<{ key: string; url: string }> {
    if (!file) throw new Error('No se recibió el archivo');

    const { buffer, mimeType, extension } = await optimizeImage(file.buffer, format, resize);
    void mimeType;

    const fileKey = `${folder}/${namePrefix ? `${namePrefix}_` : ''}${Date.now()}-${randomUUID()}.${extension}`;
    const fullPath = path.join(UPLOADS_DIR, fileKey);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

    return { key: fileKey, url: `${base}/uploads/${fileKey}` };
}
