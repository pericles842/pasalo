# CORS y dominios — decisión de arquitectura

## Problema recurrente

El login desde `https://www.pasalo.co.ve` fallaba con:

```text
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Cada vez que aparecía, la reacción fue agregar el dominio nuevo a `CORS_ORIGIN`.
Eso trata el síntoma: la lista crece, y cualquier variante que falte (`www`, un
subdominio de QA, `http` en vez de `https`) vuelve a romper el login.

## Causa real

La aplicación se servía desde **dos orígenes distintos** para el mismo contenido:

```text
https://pasalo.co.ve        ← misma web
https://www.pasalo.co.ve    ← misma web, otro Origin para el navegador
```

Para el navegador son dos orígenes sin relación. Cualquier configuración basada
en enumerarlos es frágil por definición.

## Decisión: un solo origen canónico

`https://pasalo.co.ve` es el origen canónico. Todo host que empiece con `www.`
**redirige 301** hacia él.

```text
https://www.pasalo.co.ve/...
        │
        │ 301
        ▼
https://pasalo.co.ve/...  ──── XHR ────►  https://api.pasalo.co.ve
                                          CORS_ORIGIN=https://pasalo.co.ve
```

Consecuencias:

* El navegador solo puede emitir **un** `Origin` en producción.
* `CORS_ORIGIN` tiene **una** entrada por entorno, no una lista que crece.
* Se elige el apex por coherencia: `api.pasalo.co.ve` y `cdn.pasalo.co.ve` ya son
  subdominios de `pasalo.co.ve`.
* Beneficio secundario: SEO sin contenido duplicado y una sola URL en analytics.

Esto es lo que hace cualquier sitio en producción. No se resuelve con comodines
en CORS: el estándar (Fetch) **no admite** patrones como `https://*.pasalo.co.ve`
en `Access-Control-Allow-Origin`; solo un origen exacto o `*`, y `*` es
incompatible con `credentials: true`, que la API usa.

## Dónde está implementado

`pasalo-web` es Angular con SSR, o sea un servidor Express propio
(`dist/pasalo.ve/server/server.mjs`). El redirect vive ahí, en
`pasalo.ve/src/server.ts`, como primer middleware:

```ts
app.use((req, res, next) => {
  const host = req.headers.host;
  if (!host?.startsWith('www.')) return next();
  res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
});
```

Va **antes** de los estáticos para que aplique a todas las peticiones, y
conserva ruta y query (`req.originalUrl`), de modo que un enlace compartido a
`www.pasalo.co.ve/p/abc123` sigue llegando a la orden correcta.

Al estar en el repo, viaja con cada despliegue y no depende de configuración
manual en el panel.

### Requisito en Dokploy

Falta un paso que no se puede resolver desde el código: **`www.pasalo.co.ve`
debe estar dado de alta como dominio del servicio `pasalo-web`**. Si no,
Traefik no enruta ese host y la petición nunca llega al servidor SSR. Además,
así Traefik emite certificado para `www` — el redirect viaja sobre HTTPS y sin
certificado válido el navegador falla *antes* de poder seguirlo.

DNS: `www.pasalo.co.ve` debe apuntar al VPS (A, o CNAME al apex). Un wildcard
`*.pasalo.co.ve` cubre `www` y `api`, pero **nunca el apex** (RFC 4592): el apex
siempre necesita su propio registro.

### Alternativa: hacerlo en Traefik

Si más adelante se prefiere resolverlo en el borde, sin que la petición llegue a
Node, los labels sobre `pasalo-web` son:

```text
traefik.http.middlewares.www-to-apex.redirectregex.regex=^https?://www\.(.+)
traefik.http.middlewares.www-to-apex.redirectregex.replacement=https://${1}
traefik.http.middlewares.www-to-apex.redirectregex.permanent=true
traefik.http.routers.pasalo-web-www.middlewares=www-to-apex
```

Las dos opciones son válidas; no hay que aplicar ambas.

## Configuración de la API

`CORS_ORIGIN` guarda el origen canónico del entorno:

```env
# produccion
CORS_ORIGIN=https://pasalo.co.ve

# local
CORS_ORIGIN=http://localhost:4200
```

Sin comillas, sin espacios y sin slash final: el navegador nunca manda slash
final en `Origin`, así que `https://pasalo.co.ve/` no haría match.

## Por qué la variable no se estaba leyendo

Aparte del tema de dominios había un bug que producía el mismo síntoma.
`app.ts` llamaba a `dotenv.config()` **después** de sus `import`, y los imports
se evalúan antes que los statements. `cors.ts` leía `process.env.CORS_ORIGIN` al
importarse, o sea con el entorno todavía vacío, y caía al valor por defecto.

Se corrigió con `pasalo.api/src/app/config/env.ts`, que carga el `.env` con ruta
absoluta (dotenv resuelve contra el *cwd* del proceso, y en contenedor el cwd no
siempre es la raíz del proyecto) y se importa como primera línea de `app.ts`.

Al arrancar, la API registra qué orígenes quedaron activos:

```text
🟢 CORS habilitado para: https://pasalo.co.ve
```

Ese log es el primer lugar donde mirar si el error vuelve a aparecer: dice si el
proceso leyó la variable o está usando el valor por defecto.

## Diagnóstico

```bash
# debe responder 301 hacia https://pasalo.co.ve/
curl -sI https://www.pasalo.co.ve | grep -i "^HTTP\|^location"

# debe conservar la ruta
curl -sI https://www.pasalo.co.ve/p/abc123 | grep -i "^location"

# debe devolver Access-Control-Allow-Origin: https://pasalo.co.ve
curl -s -D- -o /dev/null -X OPTIONS https://api.pasalo.co.ve/api/auth/login \
  -H "Origin: https://pasalo.co.ve" \
  -H "Access-Control-Request-Method: POST" | grep -i "^HTTP\|access-control"
```

Si el redirect responde 301 y el preflight trae el header, el problema está
resuelto en la capa correcta.
