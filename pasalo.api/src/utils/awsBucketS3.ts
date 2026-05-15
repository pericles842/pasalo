import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { optimizeImage, ResizeOptions } from './ImageOptimize';

dotenv.config();

// Inicialización del cliente S3
const s3 = new S3Client({
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
export const uploadToS3 = async (
  file: any,
  folder: string,
  keyToReplace?: string,
  format?: 'png' | 'jpg' | 'webp',
  width?: ResizeOptions
): Promise<{ key: string; url: string }> => {
  if (!file) throw new Error('No se recibió el archivo');

  const { buffer: optimized, mimeType, extension } = await optimizeImage(file.buffer, format, width);

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

  await s3.send(new PutObjectCommand(uploadParams));

  return {
    key: fileKey,
    url: `https://${BUCKET}.s3.amazonaws.com/${fileKey}`
  };
};

/* ---------------------------------------------------------
   OBTENER URL FIRMADA PARA ARCHIVOS PRIVADOS
----------------------------------------------------------*/
export const getSignedFileUrl = async (key: string, expiresInSeconds = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return signedUrl;
};

/* ---------------------------------------------------------
   LISTAR ARCHIVOS DE UNA CARPETA
----------------------------------------------------------*/
export const listFiles = async (folder: string) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `${folder}/`
  });

  const data = await s3.send(command);
  return data.Contents || [];
};

/**
 * Elimina uno o varios archivos del bucket
 *
 * @param key url del archivo
 * @example 'folder/relative_path'
 * @returns
 */
export const deleteFile = async (key: string | string[]) => {
  if (Array.isArray(key)) {
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: key.map((k) => ({ Key: k }))
      }
    });

    await s3.send(command);
    return { deleted: true, keys: key };
  }

  // Borrar uno
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  await s3.send(command);
  return { deleted: true, key };
};

/* ---------------------------------------------------------
   OBTENER URL PÚBLICA (solo para carpeta public/)
----------------------------------------------------------*/
export const getPublicUrl = (key: string) => {
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
};

export const extractKeyFromUrl = (folder: string, url: string): string | null => {
  if (!url) return null;

  const index = url.indexOf(`/${folder}/`);
  if (index === -1) return null;

  return url.substring(index + 1);
};
