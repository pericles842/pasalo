import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Comprime (gzip/brotli segun Accept-Encoding) el HTML del SSR y los estaticos
 * de texto. El bundle de CSS ronda los 670 KB y los chunks de JS cientos de KB;
 * sin esto se servian en crudo. Va antes que express.static y que el handler de
 * Angular para que aplique a todo. Los .png/.avif/.webp ya vienen comprimidos y
 * compression los salta solo por content-type.
 */
app.use(compression());

/**
 * Redirige cualquier host que empiece con "www." al dominio canonico, con un
 * 301 permanente y conservando ruta y query.
 *
 * Asi la app queda accesible desde un unico origen y el navegador nunca emite
 * Origin: https://www.pasalo.co.ve contra api.pasalo.co.ve, que era la causa de
 * los errores de CORS. Ver docs/CORS_DOMINIOS.md
 *
 * Va antes que los estaticos para que aplique a TODAS las peticiones.
 */
app.use((req, res, next) => {
  const host = req.headers.host;
  if (!host?.startsWith('www.')) return next();

  // Siempre https: es el esquema canonico y evita un segundo salto.
  res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
});

/**
 * El boton "Continuar con Google" (Google Identity Services) se comunica con
 * la ventana que abre via window.postMessage. El aislamiento de origen que
 * Chrome aplica por defecto en paginas HTTPS bloquea ese postMessage salvo
 * que el propio servidor declare explicitamente que permite popups del mismo
 * origen (sin esto: "Cross-Origin-Opener-Policy policy would block the
 * window.postMessage call" en consola, y el login con Google no completa).
 * https://developers.google.com/identity/gsi/web/guides/fedcm-migration
 */
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Cache en memoria del HTML del SSR.
 *
 * La sesion vive en localStorage (ver auth.service.ts), no en cookie: el
 * servidor nunca sabe quien es el visitante, asi que para una misma URL el SSR
 * SIEMPRE renderiza el mismo HTML (el shell deslogueado) y el cliente lo hidrata
 * despues con su token. Por eso es seguro cachear la respuesta por URL.
 *
 * Sin esto, cada visita re-renderiza todo el arbol de Angular (~880 ms de TTFB
 * segun Lighthouse). Con esto, un acierto responde en microsegundos. El TTL
 * corto acota cuanto puede quedar viejo un cambio; el proceso al reiniciar
 * (deploy) arranca con el cache vacio.
 */
const HTML_CACHE = new Map<
  string,
  { body: Buffer; headers: [string, string][]; expires: number }
>();
const HTML_CACHE_TTL_MS = 5 * 60 * 1000;
const HTML_CACHE_MAX_ENTRIES = 150;
// Headers que dependen del transporte: los pone compression/Express, no se
// replayean desde el cache.
const HOP_BY_HOP = new Set(['content-length', 'content-encoding', 'transfer-encoding']);

app.use((req, res, next) => {
  const cacheable = req.method === 'GET';
  const key = req.originalUrl;

  if (cacheable) {
    const hit = HTML_CACHE.get(key);
    if (hit && hit.expires > Date.now()) {
      res.setHeader('X-SSR-Cache', 'HIT');
      for (const [name, value] of hit.headers) res.setHeader(name, value);
      res.end(hit.body);
      return;
    }
  }

  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) return next();

      const contentType = response.headers.get('content-type') ?? '';
      const shouldCache =
        cacheable &&
        response.status === 200 &&
        contentType.includes('text/html') &&
        !response.headers.has('set-cookie');

      if (!shouldCache) return writeResponseToNodeResponse(response, res);

      const body = Buffer.from(await response.arrayBuffer());
      const headers: [string, string][] = [];
      response.headers.forEach((value, name) => {
        if (!HOP_BY_HOP.has(name.toLowerCase())) headers.push([name, value]);
      });

      if (HTML_CACHE.size >= HTML_CACHE_MAX_ENTRIES) {
        HTML_CACHE.delete(HTML_CACHE.keys().next().value as string);
      }
      HTML_CACHE.set(key, { body, headers, expires: Date.now() + HTML_CACHE_TTL_MS });

      res.statusCode = 200;
      res.setHeader('X-SSR-Cache', 'MISS');
      for (const [name, value] of headers) res.setHeader(name, value);
      res.end(body);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
