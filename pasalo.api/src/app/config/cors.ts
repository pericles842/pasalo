/**
 * Origenes permitidos por CORS, compartidos entre Express (app.ts) y
 * Socket.IO (socket.ts).
 *
 * La web se sirve desde un unico origen canonico (https://pasalo.co.ve) y
 * www redirige 301 en Traefik, asi que en produccion el navegador solo puede
 * mandar ese Origin. La lista existe para los entornos que si difieren
 * (local, QA), no para acumular variantes del mismo dominio.
 *
 * Ver docs/CORS_DOMINIOS.md
 */
const DEFAULT_ORIGINS = 'https://pasalo.co.ve';

export function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? DEFAULT_ORIGINS)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, '')) // el navegador nunca manda slash final
    .filter(Boolean);
}
