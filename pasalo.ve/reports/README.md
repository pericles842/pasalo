# Reportes de rendimiento (PageSpeed / Lighthouse)

Deja aquí los reportes que exportas de PageSpeed Insights para que se puedan
analizar y resolver en el código.

## Qué archivo necesito

El **JSON** del reporte Lighthouse (no la captura de pantalla, no el PDF).

### Cómo obtenerlo

**Opción A — desde PageSpeed Insights (web)**
1. Abre https://pagespeed.web.dev/ y analiza la URL.
2. En los resultados, arriba a la derecha del bloque de Lighthouse,
   menú `⋮` → **"Save as JSON"** (o botón de descarga).
3. Guarda el archivo en esta carpeta.

**Opción B — con Lighthouse CLI (local o prod, lo corres tú)**
```bash
npx lighthouse https://TU-URL \
  --preset=perf \
  --output=json --output=html \
  --output-path=./pasalo.ve/reports/lh-NOMBRE \
  --chrome-flags="--headless"
```
Genera `lh-NOMBRE.report.json` (para analizar) y `lh-NOMBRE.report.html` (para ti).

## Convención de nombres

```
psi-YYYY-MM-DD-<pagina>-<mobile|desktop>.json
```

Ejemplos:
- `psi-2026-09-08-home-mobile.json`
- `psi-2026-09-08-orders-list-mobile.json`
- `psi-2026-09-08-login-desktop.json`

## Al entregar

Dime qué archivo(s) revisar y en qué orden de prioridad. Por ejemplo:
> "Lee `psi-2026-09-08-home-mobile.json` y resuelve lo que se pueda en el código."
