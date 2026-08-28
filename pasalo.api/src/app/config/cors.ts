/**
 * Orígenes permitidos por CORS, compartidos entre Express (app.ts) y
 * Socket.IO (socket.ts). Se definen en CORS_ORIGIN separados por coma
 * para soportar varios dominios (ej. producción + QA).
 */
export const corsOrigins = (process.env.CORS_ORIGIN ?? 'https://pasalo.co.ve')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
