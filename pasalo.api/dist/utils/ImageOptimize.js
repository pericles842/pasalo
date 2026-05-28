"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const optimizeImage = async (buffer, format = 'webp', resize = { width: 800, height: 800, fit: 'inside' }) => {
    let pipeline = (0, sharp_1.default)(buffer).resize({
        width: resize.width,
        height: resize.height,
        fit: resize.fit ?? 'inside',
        withoutEnlargement: true
    });
    let optimized;
    let mimeType;
    let extension;
    switch (format) {
        case 'png':
            optimized = await pipeline.png({ compressionLevel: 9 }).toBuffer();
            mimeType = 'image/png';
            extension = 'png';
            break;
        case 'jpg':
            optimized = await pipeline.jpeg({ quality: 80 }).toBuffer();
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'webp':
            optimized = await pipeline.webp({ quality: 80 }).toBuffer();
            mimeType = 'image/webp';
            extension = 'webp';
            break;
        default:
            throw new Error('Formato no soportado');
    }
    return {
        buffer: optimized,
        mimeType,
        extension
    };
};
exports.optimizeImage = optimizeImage;
