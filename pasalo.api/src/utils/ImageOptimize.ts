import sharp from 'sharp';

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: keyof sharp.FitEnum;
}

export const optimizeImage = async (
  buffer: Buffer,
  format: 'png' | 'jpg' | 'webp' = 'webp',
  resize: ResizeOptions = { width: 800, height: 800, fit: 'inside' }
) => {
  let pipeline = sharp(buffer).resize({
    width: resize.width,
    height: resize.height,
    fit: resize.fit ?? 'inside',
    withoutEnlargement: true
  });

  let optimized: Buffer;
  let mimeType: string;
  let extension: string;

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
