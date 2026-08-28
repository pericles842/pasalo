/**
 * Redimensiona y comprime una imagen en el navegador antes de subirla: reduce
 * el peso del archivo (fotos de cámara pueden pesar varios MB) para que la
 * subida sea rápida incluso con mala conexión.
 */
export function compressImage(file: File, maxSize = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      const finish = (blob: Blob) => {
        // Si la compresión no ayudó (imagen pequeña o ya optimizada), se queda con la original
        if (blob.size >= file.size) { resolve(file); return; }

        const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
        const name = file.name.replace(/\.[^.]+$/, '') + '.' + extension;
        resolve(new File([blob], name, { type: blob.type }));
      };

      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }

        // Safari viejo ignora 'image/webp' y devuelve PNG sin comprimir: se reintenta con jpeg
        if (blob.type !== 'image/webp') {
          canvas.toBlob((jpegBlob) => jpegBlob ? finish(jpegBlob) : resolve(file), 'image/jpeg', quality);
          return;
        }

        finish(blob);
      }, 'image/webp', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
