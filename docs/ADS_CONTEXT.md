# Pásalo — Contexto de publicidad (ads)

> Documento de referencia para la feature de publicidad dentro del dashboard de Pásalo. Complementa [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) (negocio y arquitectura general) y [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) (esquema completo de `pasalo-master`). Esquema extraído en vivo el 26 de agosto de 2026, después del refactor que separó las ubicaciones de publicidad en su propia tabla.

## 1. Contexto de negocio

Pásalo le vende espacio publicitario dentro de su propio dashboard a **empresas anunciantes** — que pueden ser clientes de Pásalo o terceros — para que otras empresas que usan la plataforma vean sus anuncios mientras trabajan (dueños de tienda, vendedores, soporte). No es publicidad para el comprador final en la pantalla pública de pago; es publicidad dentro del panel de gestión.

**Por qué existe:** una fuente de ingreso adicional a las suscripciones (`plans`), vendiendo los espacios de UI que ya existen en el dashboard (header, debajo del menú, un popup) sin construir un ad-exchange — es venta directa, manual, uno a uno con cada anunciante.

**Cómo se vende hoy (manual, sin checkout):** la página pública `/publicidad` (`pages/ads/`) muestra el catálogo de planes activos y sus precios; el botón "Contratar" abre WhatsApp con un mensaje pre-armado (mismo patrón que el cambio de plan de suscripción). No hay pago ni alta automática — un humano del lado de Pásalo negocia y da de alta el anuncio a mano en la base de datos.

## 2. Contexto de suscripción de empresas anunciantes

Un anunciante no "se suscribe" en el sentido de `companies_subscriptions` (eso es exclusivo de las empresas que usan Pásalo para vender) — contrata un **plan de publicidad** (`plans_ads`) por un período fijo (`duration_days`, hoy 30 días para ambos planes), y eso se materializa dando de alta una fila en `ads` con fecha de inicio/fin propias. No hay renovación automática: cuando `end_date` pasa, el anuncio deja de salir en el sorteo (el motor filtra por fecha en cada pedido), y alguien tiene que crear una fila nueva a mano si el anunciante renueva.

**Planes activos hoy:**

| Plan | Ubicaciones que incluye | Precio | Duración |
|---|---|---|---|
| **Plan Dashboard** | `header-dashboard` + `footer-menu-dashboard` (mismas fotos rotando en ambos espacios) | $22 | 30 días |
| **Modal Emergente** | `modal` | $20 | 30 días |

El paso manual de "dar de alta un anuncio" es: crear una fila en `ads` con `plan_ads_id` apuntando al plan contratado, y subir las fotos del anunciante a la carpeta `folder_name` (convención `ads-<slug-empresa>`, ej. `ads-havana`) — en disco bajo `/uploads/` mientras no haya credenciales AWS, o como prefijo en la raíz del bucket S3 el día que las haya. Eso es lo que dejó pendiente el comentario "para luego agregar las imágenes manualmente" del pedido original: no hay UI de carga de fotos, es un paso de operaciones a mano.

## 3. Esquema de tablas (`pasalo-master`)

Todas viven en la base master (igual que `plans`/`companies_subscriptions`, el sistema de suscripción de Pásalo) — no son datos por tenant, porque el mismo catálogo de anuncios se muestra a **todas** las empresas que usan el dashboard.

### `ads_locations`
Catálogo de ubicaciones de publicidad disponibles en la plataforma. Agregar una ubicación nueva (ej. un banner en el footer público) es insertar una fila acá — no requiere tocar ningún enum ni el motor de anuncios ni el frontend, que renderiza `location.name` directo de la API. Esto es explícitamente lo que reemplazó al enum fijo `AdPlacement` que existía antes del refactor.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `key` | varchar(100) UNIQUE | Clave libre en minúsculas/guiones (ej. `header-dashboard`), es lo que usa el frontend en `<app-ad-slot placement="...">` y la URL `GET /ads/:placement` |
| `name` | varchar(255) | Label legible, se muestra tal cual en `/publicidad` (no hay diccionario de labels en el frontend) |
| `status` | enum('active','inactive') | Una ubicación `inactive` deja de poder sortear anuncios aunque el `ads` siga activo |
| `createdAt`/`updatedAt` | datetime | |

Datos actuales (seed, migración `021-ads-locations.js`):

| id | key | name |
|---|---|---|
| 1 | `header-dashboard` | Header del Dashboard |
| 2 | `footer-menu-dashboard` | Footer del Menú (Dashboard) |
| 3 | `modal` | Modal Emergente |

### `plans_ads`
Catálogo de planes de publicidad que se le venden a las empresas anunciantes (no confundir con `plans`, que son los planes de suscripción de Pásalo a sus vendedores). Ya **no tiene un placement fijo** — qué ubicaciones incluye se arma vía `plan_ads_locations`, lo que permite vender combos (ver Plan Dashboard arriba).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `name` | varchar(255) | |
| `priority` | int, default 1 | **Vestigial**: no lo lee el motor de sorteo (ver §4) — es un valor sugerido para cuando se crea el `ads` concreto, no se aplica solo |
| `price` | double | USD |
| `duration_days` | int, default 30 | |
| `description` | varchar(255) NULL | Se muestra en la card de `/publicidad` |
| `status` | enum('active','inactive') | Solo los `active` aparecen en `GET /ads/plans` |
| `createdAt`/`updatedAt` | datetime | |

### `plan_ads_locations`
Tabla puente N:M entre `plans_ads` y `ads_locations` — qué ubicaciones trae cada plan. Índice único compuesto (`plan_ads_id`, `ad_location_id`) para que no se pueda repetir la misma ubicación dos veces en el mismo plan.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `plan_ads_id` | int FK → `plans_ads.id`, CASCADE | |
| `ad_location_id` | int FK → `ads_locations.id`, CASCADE | |
| `createdAt`/`updatedAt` | datetime | |

### `ads`
Un anuncio contratado y concreto (una fila = un anunciante con un plan activo). **Ya no guarda su propio placement** — en qué ubicación(es) aparece lo hereda de `plan_ads_id → plans_ads → plan_ads_locations`. Por eso `plan_ads_id` es `NOT NULL`: un anuncio sin plan no tiene dónde mostrarse.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `plan_ads_id` | int FK → `plans_ads.id`, `RESTRICT` | Obligatorio; no se puede borrar un plan mientras tenga anuncios activos referenciándolo |
| `company_name` | varchar(255) | Nombre del anunciante, se muestra como `title`/`alt` del link |
| `folder_name` | varchar(255) UNIQUE | Convención obligatoria `ads-<slug-empresa>` (ej. `ads-havana`); es la carpeta exclusiva de esa empresa con sus fotos — una carpeta = un anunciante, N fotos adentro |
| `target_url` | varchar(255) | A dónde lleva el click. Es siempre un **link externo** (`target="_blank"`), nunca navega dentro del sistema |
| `priority` | int, default 1 (1–10) | Este sí lo usa el motor: pondera qué anuncio sale cuando varios compiten por la misma ubicación (ver §4) |
| `start_date`/`end_date` | date | Vigencia del contrato; fuera de este rango el anuncio no entra en el sorteo aunque `status` sea `active` |
| `price_charged` | double | Lo que se le cobró realmente a este anunciante (puede diferir del `price` de lista del plan por negociación) |
| `status` | enum('active','paused','expired') | Solo `active` entra en el sorteo |
| `impressions_count`/`clicks_count` | int, default 0 | Se incrementan en cada sorteo ganado y en cada `POST /ads/:id/click` respectivamente — es la métrica que le mostrarías a un anunciante para justificar el precio |
| `interval_seconds` | int NULL | Cada cuántos segundos se vuelve a disparar; lo usa sobre todo `modal` (el Dashboard del frontend agenda el siguiente popup con este valor, o 15 min por defecto si es null) |
| `createdAt`/`updatedAt` | datetime | |

## 4. Motor de selección (`src/utils/adsEngine.ts`)

`getAdForPlacement(locationKey)` — se llama en `GET /ads/:placement` y desde el `AdSlot`/Dashboard del frontend:

1. Busca `ads` con `status: 'active'` y `start_date`/`end_date` vigentes **hoy**, cuyo `plan_ads_id` tenga, vía `plan_ads_locations`, una ubicación con `key = locationKey` y `status: 'active'`.
2. **Sorteo ponderado por `priority`** (`weightedPick`) entre los candidatos — no es un ranking fijo: uno de prioridad baja igual puede salir, solo que con menor frecuencia. La probabilidad de cada uno es `priority / suma_de_priorities`.
3. Del anuncio ganador, elige **una foto al azar** dentro de su `folder_name` (`pickRandomImageUrl`) — lee de S3 si `AWS_BUCKET`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` están seteados (mismo criterio que `storage.ts`), si no de `/uploads` en disco.
4. Si la carpeta ganadora no tiene fotos válidas (`.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`), se descarta ese candidato y se vuelve a sortear entre el resto — así una carpeta vacía no rompe el placement entero, solo se salta.
5. Si hay foto: incrementa `impressions_count` y devuelve `{ id, company_name, target_url, placement, image_url, interval_seconds }` (`placement` es la clave que se pidió, no una columna propia de `ads`).
6. Si no queda ningún candidato con fotos: `204 No Content` — el frontend cae al placeholder ("Aquí va tu publicidad") o simplemente no muestra el modal.

`registerAdClick(adId)` — `POST /ads/:id/click`, incrementa `clicks_count`. Se llama en cada click del `AdSlot`/`AdModal`, no bloquea la navegación (el link ya abre en pestaña nueva).

## 5. Integración en el frontend (`pasalo.ve`)

| Ubicación (`key`) | Dónde vive | Cómo se dispara |
|---|---|---|
| `header-dashboard` | `header-dashboard.html`, centro del header sticky | `<app-ad-slot placement="header-dashboard">` — pide un anuncio una vez en `ngOnInit` |
| `footer-menu-dashboard` | `dashboard.html`, debajo del `<nav>` del sidebar | `<app-ad-slot placement="footer-menu-dashboard">` — igual que arriba |
| `modal` | No vive en ninguna plantilla — lo dispara `Dashboard` (`dashboard.ts`) con `NbDialogService.open(AdModal, ...)` | Primer intento a los 8s de entrar al dashboard; si hay anuncio, lo muestra y agenda el siguiente usando `ad.interval_seconds` (o 15 min por defecto si no vino ninguno) |

`AdSlot` (`shared/components/ad-slot/`) es el componente reutilizable para placements "estáticos" (piden un anuncio una vez al montar, muestran imagen + link, o un placeholder punteado si no hay nada activo). `AdModal` (`shared/components/ad-modal/`) es el popup para `modal`, con botón de cerrar.

`AdPlacement` en `shared/services/ads.service.ts` es `string` (no un union fijo) a propósito — coincide 1 a 1 con `ads_locations.key`, así que agregar una ubicación nueva no pide tocar tipos ni componentes del frontend, solo la fila en la tabla y el `<app-ad-slot placement="...">` donde corresponda mostrarla.

## 6. Endpoints (`GET/POST /ads/*`, ver `routes.ts` para el detalle Swagger)

| Endpoint | Uso |
|---|---|
| `GET /ads/plans` | Catálogo de planes activos + sus ubicaciones (`include` de `ads_locations` vía `plan_ads_locations`) — lo consume `/publicidad` |
| `GET /ads/locations` | Catálogo de ubicaciones activas — pensado para cuando exista un CRUD de `ads`, hoy no lo consume nada en el frontend |
| `GET /ads/:placement` | Sortea un anuncio para esa ubicación (ver §4). `204` si no hay ninguno vigente. Ya no valida contra una lista fija de placements — una clave que no exista en `ads_locations` simplemente no matchea ningún candidato y también devuelve `204` |
| `POST /ads/:id/click` | Registra un click |

## 7. Pendientes / decisiones abiertas

- **No hay CRUD de `ads` ni de `plans_ads`/`ads_locations`.** Dar de alta un anunciante, un plan nuevo o una ubicación nueva es a mano en la base de datos (o vía migración/seed, como se hizo con el catálogo inicial). `GET /ads/locations` ya existe pensando en un futuro formulario de alta.
- **La subida de fotos es 100% manual** — crear la carpeta `ads-<slug>` y copiar las imágenes, en disco o S3 según el entorno. No hay endpoint de upload para anunciantes.
- **`plans_ads.priority` no se usa en el motor** — es un valor sugerido sin efecto real hoy; si se necesita que el plan influya en el sorteo, habría que decidir cómo se combina con el `priority` propio de cada `ads` (¿hereda, se multiplica, se ignora uno de los dos?).
- **Sin renovación automática.** Cuando `end_date` vence, el anuncio deja de salir solo; nadie recibe aviso de que venció ni se genera una orden de cobro — es proceso manual de principio a fin, igual que la venta.
- **Multi-tenant no aplica acá.** A diferencia de `orders`/`payment_methods` (una base por empresa), todo lo de ads vive en `pasalo-master` porque el catálogo de anunciantes es transversal a la plataforma, no propiedad de una empresa cliente.
