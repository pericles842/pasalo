"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeyFromUrl = exports.getPublicUrl = exports.deleteFile = exports.listFiles = exports.getSignedFileUrl = exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
const ImageOptimize_1 = require("./ImageOptimize");
dotenv_1.default.config();
// Inicialización del cliente S3
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});
// Nombre del bucket desde el .env
const BUCKET = process.env.AWS_BUCKET || '';
/* ---------------------------------------------------------
   SUBIR ARCHIVO A UNA CARPETA
----------------------------------------------------------*/
const uploadToS3 = async (file, folder, keyToReplace, format, width) => {
    if (!file)
        throw new Error('No se recibió el archivo');
    const { buffer: optimized, mimeType, extension } = await (0, ImageOptimize_1.optimizeImage)(file.buffer, format, width);
    //extensión del archivo segun la optimization
    const fileKey = keyToReplace || `${folder}/${Date.now()}.${extension}`;
    //parametros para la subida
    const uploadParams = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: optimized,
        ContentType: mimeType,
        CacheControl: 'no-cache, no-store, must-revalidate'
    };
    await s3.send(new client_s3_1.PutObjectCommand(uploadParams));
    return {
        key: fileKey,
        url: `https://${BUCKET}.s3.amazonaws.com/${fileKey}`
    };
};
exports.uploadToS3 = uploadToS3;
/* ---------------------------------------------------------
   OBTENER URL FIRMADA PARA ARCHIVOS PRIVADOS
----------------------------------------------------------*/
const getSignedFileUrl = async (key, expiresInSeconds = 3600) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });
    const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
    return signedUrl;
};
exports.getSignedFileUrl = getSignedFileUrl;
/* ---------------------------------------------------------
   LISTAR ARCHIVOS DE UNA CARPETA
----------------------------------------------------------*/
const listFiles = async (folder) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${folder}/`
    });
    const data = await s3.send(command);
    return data.Contents || [];
};
exports.listFiles = listFiles;
/**
 * Elimina uno o varios archivos del bucket
 *
 * @param key url del archivo
 * @example 'folder/relative_path'
 * @returns
 */
const deleteFile = async (key) => {
    if (Array.isArray(key)) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: {
                Objects: key.map((k) => ({ Key: k }))
            }
        });
        await s3.send(command);
        return { deleted: true, keys: key };
    }
    // Borrar uno
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });
    await s3.send(command);
    return { deleted: true, key };
};
exports.deleteFile = deleteFile;
/* ---------------------------------------------------------
   OBTENER URL PÚBLICA (solo para carpeta public/)
----------------------------------------------------------*/
const getPublicUrl = (key) => {
    return `https://${BUCKET}.s3.amazonaws.com/${key}`;
};
exports.getPublicUrl = getPublicUrl;
const extractKeyFromUrl = (folder, url) => {
    if (!url)
        return null;
    const index = url.indexOf(`/${folder}/`);
    if (index === -1)
        return null;
    return url.substring(index + 1);
};
exports.extractKeyFromUrl = extractKeyFromUrl;
