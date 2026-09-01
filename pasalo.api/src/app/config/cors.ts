/**
 * Orígenes permitidos por CORS, compartidos entre Express (app.ts) y
 * Socket.IO (socket.ts). Se definen en CORS_ORIGIN separados por coma
 * para soportar varios dominios (ej. producción + www + QA).
 */
const DEFAULT_ORIGINS = 'https://pasalo.co.ve,https://www.pasalo.co.ve';

export const corsOrigins = (process.env.CORS_ORIGIN ?? DEFAULT_ORIGINS)
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, '')) // el navegador nunca manda slash final
  .filter(Boolean);
