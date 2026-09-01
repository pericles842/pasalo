import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

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
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
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
