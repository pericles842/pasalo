"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const ImageOptimize_1 = require("./ImageOptimize");
const awsBucketS3_1 = require("./awsBucketS3");
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
/** Cuando estas variables existan, el mismo código sube a S3 en vez de a disco */
function isS3Configured() {
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
async function uploadFile(file, folder, format, resize) {
    if (isS3Configured()) {
        return (0, awsBucketS3_1.uploadToS3)(file, folder, undefined, format, resize);
    }
    return uploadToLocal(file, folder, format, resize);
}
async function uploadToLocal(file, folder, format, resize) {
    if (!file)
        throw new Error('No se recibió el archivo');
    const { buffer, mimeType, extension } = await (0, ImageOptimize_1.optimizeImage)(file.buffer, format, resize);
    void mimeType;
    const fileKey = `${folder}/${Date.now()}-${(0, crypto_1.randomUUID)()}.${extension}`;
    const fullPath = path_1.default.join(UPLOADS_DIR, fileKey);
    await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
    await promises_1.default.writeFile(fullPath, buffer);
    const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    return { key: fileKey, url: `${base}/uploads/${fileKey}` };
}
