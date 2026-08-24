import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// guarda los archivos en buffer
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileFilter(req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(new Error('Solo se permiten imágenes (jpg, png, webp o gif)'));
    return;
  }

  callback(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
