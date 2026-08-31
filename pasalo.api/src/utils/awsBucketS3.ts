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

// El cliente se crea recien cuando se usa: si AWS_REGION no esta configurado
// (mientras se sube a disco vía storage.ts), importar este archivo no debe
// tumbar el servidor.
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  return s3Client;
}

// Nombre del bucket desde el .env
const BUCKET = process.env.AWS_BUCKET || '';

// Base publica del bucket R2 (r2.dev o dominio propio), sin slash final
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

/* ---------------------------------------------------------
   SUBIR ARCHIVO A UNA CARPETA
----------------------------------------------------------*/
export const uploadToS3 = async (
  file: any,
  folder: string,
  keyToReplace?: string,
  format?: 'png' | 'jpg' | 'webp',
  width?: ResizeOptions,
  namePrefix?: string
): Promise<{ key: string; url: string }> => {
  if (!file) throw new Error('No se recibió el archivo');

  const { buffer: optimized, mimeType, extension } = await optimizeImage(file.buffer, format, width);

  //extensión del archivo segun la optimization
  const fileKey = keyToReplace || `${folder}/${namePrefix ? `${namePrefix}_` : ''}${Date.now()}.${extension}`;

  //parametros para la subida
  const uploadParams = {
    Bucket: BUCKET,
    Key: fileKey,
    Body: optimized,
    ContentType: mimeType,
    CacheControl: 'no-cache, no-store, must-revalidate'
  };

  await getS3Client().send(new PutObjectCommand(uploadParams));

  return {
    key: fileKey,
    url: getPublicUrl(fileKey)
  };
};

/* ---------------------------------------------------------
   DESCARGAR ARCHIVO (proxy para forzar la descarga en el navegador)
----------------------------------------------------------*/
export const getFileStream = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  const response = await getS3Client().send(command);

  return {
    body: response.Body as NodeJS.ReadableStream,
    contentType: response.ContentType
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

  const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
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

  const data = await getS3Client().send(command);
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

    await getS3Client().send(command);
    return { deleted: true, keys: key };
  }

  // Borrar uno
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  await getS3Client().send(command);
  return { deleted: true, key };
};

/* ---------------------------------------------------------
   OBTENER URL PÚBLICA (solo para carpeta public/)
----------------------------------------------------------*/
export const getPublicUrl = (key: string) => {
  return `${PUBLIC_URL}/${key}`;
};

export const extractKeyFromUrl = (folder: string, url: string): string | null => {
  if (!url) return null;

  const index = url.indexOf(`/${folder}/`);
  if (index === -1) return null;

  return url.substring(index + 1);
};
