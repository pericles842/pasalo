# Pásalo — Contexto del proyecto

> Documento pensado para que una IA (o una persona nueva) entienda el proyecto rápido, sin tener que releer toda la conversación en la que se construyó. Última actualización: 20 de agosto de 2026.

## 1. Qué es Pásalo

Pásalo es un SaaS para negocios venezolanos que venden por redes sociales (Instagram, WhatsApp, Mercado Libre, Facebook). Resuelve el caos de cobrar y validar pagos manualmente por DM.

**Frase de marca:** *"Nosotros no subimos ni enviamos... lo pasamos"*

**Flujo central del negocio:**
1. El vendedor crea una orden (la venta) con los productos y los datos del comprador.
2. Pásalo genera un link de pago público (`/p/:tenant_id/:token`).
3. El comprador abre el link, ve el monto en USD y Bs, elige el método de pago (Pago Móvil, Transferencia, Zelle, etc.) y sube la foto de su comprobante.
4. El sistema intenta leer automáticamente la referencia y el monto del comprobante (OCR).
5. Si el monto coincide, la orden pasa a "Pagado" sola. Si no coincide, queda "En espera" marcada como sospechosa para que el vendedor la revise a mano.
6. El vendedor y el administrador reciben una notificación en vivo (websocket) cuando alguien paga.

## 2. Estructura del repo

```
pasalo/
├── pasalo.api/    Backend: Node + Express + TypeScript + Sequelize + MySQL
└── pasalo.ve/     Frontend: Angular 20 (standalone, zoneless, SSR) + Nebular UI + Tailwind
```

## 3. Arquitectura: multi-tenant con una base de datos por empresa

Esta es la decisión estructural más importante del proyecto y hay que entenderla antes de tocar nada.

- **`pasalo-master`**: una sola base, vive todo lo que es transversal a Pásalo como plataforma: qué empresas existen, quién es cliente, roles, planes, usuarios (personas), y a qué empresa pertenece cada usuario.
- **`pasalo_<tenant_id>`**: una base **por cada empresa**, creada automáticamente al registrarse (`pasalo_coffeecode`, `pasalo_pasalodemo`, etc.). Ahí vive la operación diaria de esa empresa: órdenes, productos, métodos de pago, notificaciones.

`tenant_id` sale de parsear el dominio que la empresa da al registrarse (`CompanyController.parserDomain`). No es secreto — viaja en la URL pública de pago (`/p/:tenant_id/:token`) porque es la única forma de que una página sin sesión sepa a qué base de datos conectarse.

### Cómo se resuelve la conexión al tenant en cada request

- `src/app/config/tenant.ts` → `getTenantConnection(tenant_id)`: busca en `pasalo-master.companies_connections` los datos de conexión de esa empresa, abre una `Sequelize` nueva y **la cachea en memoria** (`Map`) para no reconectar en cada request.
- `src/middlewares/tenantMiddleware.ts`: resuelve la conexión a partir de `req.session.company.tenant_id` (que ya viene del JWT) y la deja en `req.tenantDb`. Se usa encadenado después de `jwtMiddleware` en cualquier ruta que toque datos de la empresa (`const authTenant = [jwtMiddleware, tenantMiddleware]` en `routes.ts`).
- La pantalla pública de pago **no tiene sesión**, así que resuelve el tenant directo desde el parámetro de la URL (`getTenantConnection(req.params.tenant_id)`), sin pasar por el middleware.

### Un detalle que rompe la intuición: las tablas del tenant NO tienen modelos Sequelize

Los modelos Sequelize (`CompanyModel`, `UserModel`, `RoleModel`, `PlanModel`, `CompanyUserModel`, en `src/app/models/`) están **todos atados a la conexión master** (`import { sequelize } from '../config/db'`).

Para las tablas de cada empresa (`orders`, `order_items`, `payment_methods`, `notifications`) **no hay clases de modelo**: los controladores usan `tenantDb.query(...)` con SQL crudo y `tenantDb.getQueryInterface().bulkInsert(...)`, porque la conexión cambia en cada request según qué empresa está autenticada. Si algún día se necesita un modelo Sequelize por tenant, habría que definirlo dinámicamente contra `tenantDb` en cada request (no existe ese patrón todavía).

### Consecuencia práctica: las migraciones de tenant no se aplican solas

- `migrations/*.js` → migran `pasalo-master`. Se corren con `npm run migrate`.
- `migrations/pasalo-client/*.js` → migran el esquema de **cada empresa**. Se aplican automáticamente **solo cuando una empresa se registra** (`CompanyModel.generateTablesForCompanyClient`, vía Umzug).
- Si agregás una migración nueva en `migrations/pasalo-client/`, las empresas que **ya existían** no la reciben solas. Hay que correr:
  ```
  npm run migrate:tenants
  ```
  (`src/scripts/migrate-tenants.ts`, lee todas las filas de `companies_connections` y les vuelve a correr `generateTablesForCompanyClient`, que es idempotente gracias a `SequelizeStorage`/Umzug).

## 4. Autenticación y permisos

- Login: `POST /api/auth/login` con correo + contraseña (bcrypt). Devuelve un JWT que incluye `user`, `role` (el slug: `admin` | `support` | `seller`) y `company` (`uuid`, `name`, `tenant_id`).
- El frontend guarda el JWT en `localStorage` (no es httpOnly cookie — es una decisión consciente de simplicidad para esta etapa, no ideal a largo plazo).
- **No hay tabla de permisología todavía.** El control de acceso está harcodeado comparando `session.role === 'admin'` en cada controlador. La idea a futuro (mencionada varias veces pero no construida) es una tabla de permisos por módulo.
- Reglas de negocio actuales:
  - Solo el `admin` (el usuario master que registró la empresa) puede: crear/eliminar usuarios, cambiar el plan, crear/eliminar métodos de pago.
  - Un `seller`/`support` solo ve **sus propias** órdenes y notificaciones; el `admin` ve todas y puede filtrar por vendedor.
  - El `admin` cuenta dentro del límite de usuarios del plan (con el Plan Gratuito, que permite 1, el admin ya ocupa el cupo).

## 5. Qué está construido (por área)

### Registro de empresa y usuarios
- `POST /company`: registra empresa + usuario master (rol admin) + suscripción al plan, todo en una transacción sobre master; después crea la base de datos del tenant (fuera de la transacción, porque los DDL de MySQL hacen commit implícito). Si falla la creación del tenant, hace rollback manual (borra la empresa y el usuario, dropea la DB si llegó a crearse).
- `GET/POST/DELETE /company/users`: CRUD de usuarios internos. El límite de usuarios lo define el plan (`plans.user_limit`), no el formulario.
- `PUT /company/subscription`: cambia de plan. No deja bajar a un plan con menos cupo que usuarios ya creados.

### Órdenes
- `POST /orders`: crea la orden con sus renglones de productos (`order_items`), calcula el total en el servidor (nunca confía en lo que mande el cliente), genera un `pay_url_token` (UUID) y devuelve la URL pública de pago.
- `GET /orders`: paginado (10 por página por defecto, `?page=`/`?limit=`), filtrable por `status_id` y (solo admin) por `seller_id`.
- `GET /orders/:id`: detalle completo con comprobante, referencia y monto extraídos.
- `PUT /orders/:id/status`: cambia el estado manualmente (lo usa tanto el select de la tabla como el botón "Confirmar pago").

### Pago público y detección de pago sospechoso
- `GET /public/orders/:tenant_id/:token`: resumen que ve el comprador (monto, vendedor, empresa, métodos de pago disponibles). Sin autenticación.
- `POST /public/orders/:tenant_id/:token/pay`: el comprador sube la foto + elige método de pago.
  - **OCR** (`src/utils/ocr.ts`, con `tesseract.js`): extrae referencia y monto de la imagen en una sola pasada. Entiende formato venezolano (`1.234,56`) y formato USD (`1,234.56`).
  - **Comparación de monto**: si el método es Pago Móvil o Transferencia (se cobra en **bolívares**), convierte el monto de la orden a Bs con la tasa BCV del momento antes de comparar. Si es Zelle/Binance (USD), compara directo. Tolerancia: 3%.
  - Si el monto **no coincide**: la orden se queda en "En espera" (`status_id = 1`), se marca `is_suspicious = true`, **no** se dispara como pago confirmado. El vendedor ve la fila en amarillo con el detalle de "Bs esperado / Bs en la foto" y un botón exclusivo "Confirmar pago" para aprobarla a mano.
  - Si coincide: `status_id = 2`, `paid_at = NOW()`, se crea una notificación y se emite el evento de websocket.
  - **Almacenamiento de la foto**: `src/utils/storage.ts` tiene la misma firma que `uploadToS3` (`src/utils/awsBucketS3.ts`). Hoy escribe a disco local (`/uploads`, servido como estático) porque no hay credenciales AWS en `.env`; el día que se llenen `AWS_*`, el mismo código sube a S3 sin tocar los controladores.

### Métodos de pago
- CRUD simple (`/company/payment-methods`), solo admin puede crear/borrar. `datos` es JSON libre según el `type` (pagomóvil pide banco/teléfono/cédula, transferencia pide banco/cuenta/cédula, billetera digital pide correo).

### Notificaciones
- Cada pago (sospechoso o no) genera una fila en `notifications` (por tenant) — es el historial persistente, además del aviso en vivo.
- `GET /notifications?limit=5` (campana) o sin límite (historial completo, hasta 100). Filtrable por vendedor si sos admin.
- `DELETE /notifications/:id` y `DELETE /notifications` (borrar todas) — cada quien borra solo las suyas, admin borra cualquiera.
- **WebSocket** (`socket.io`, `src/app/config/socket.ts`): cada usuario se autentica con el mismo JWT al conectar. Se une a la sala `user:<uuid>` (siempre) y, si es admin, también a `company:<tenant_id>:admin`. Cuando se registra un pago, se emite a ambas salas — así llega al vendedor dueño de la orden **y** al admin, a nadie más.

### Publicidad
- Pásalo vende espacio publicitario dentro de su propio dashboard a empresas anunciantes (header, debajo del menú, un modal periódico). Documento propio, con esquema y lógica de negocio: [ADS_CONTEXT.md](./ADS_CONTEXT.md).

### Tasa de cambio (BCV)
- `GET /exchange-rate`: proxy cacheado (30 min) de `https://ve.dolarapi.com/v1/dolares`. Si la API externa falla y hay un valor cacheado previo, lo sigue sirviendo en vez de romper.
- Frontend: `ExchangeRateService` la pide **una sola vez por sesión de navegador** (en el constructor del servicio, `providedIn: 'root'`) y la expone como signal (`rateOficial()`). Ningún componente vuelve a pedirla.
- Cálculo centralizado en `shared/utils/currency.ts` (`toBs`) y expuesto como pipe reutilizable `shared/pipes/bs-amount.pipe.ts` (`{{ monto | bsAmount: exchangeRate.rateOficial() }}`).

## 6. Convenciones y patrones del frontend (Angular)

- **Standalone components**, sin NgModules propios (salvo el `OrdersRoutingModule` para lazy loading).
- **`provideZonelessChangeDetection()`**: la app NO usa Zone.js. Esto tiene una trampa real: `computed()` de Angular solo reacciona a **signals**, no a lecturas de `FormControl.value` (que es una propiedad plana). Si necesitás derivar algo de un FormControl reactivamente, hay que puentear con `valueChanges.subscribe(v => signal.set(v))` y leer la signal, nunca el `.value` directo dentro de un `computed()`.
- **SSR**: casi todo componente que pide datos por HTTP hace `if (!isPlatformBrowser(...)) return;` en `ngOnInit`, para no disparar llamadas (ni intentar usar `localStorage`) durante el render en el servidor. El patrón se repite en todos lados — es intencional, no un olvido.
- **Rutas relativas de `routerLink` son sorprendentes dentro de rutas hijas**: `[routerLink]="[id]"` navega relativo a la ruta ACTIVA del componente donde está el link, no a la raíz de la app. Usar siempre `[routerLink]="['/dashboard', id]"` (absoluto) para evitar bugs silenciosos (esto causó un bug real: el botón de "ver orden" no hacía nada).
- **Nebular + overlays**: `nb-select`, `nb-autocomplete`, etc. usan por defecto la estrategia de scroll `'block'`, que depende de `NbLayoutRulerService` — un servicio que solo responde si hay un `<nb-layout>` en el árbol. La solución que quedó activa: un `<nb-layout style="display:none">` vacío y oculto en `app.html` (satisface el singleton sin envolver ni afectar ninguna pantalla), más `scrollStrategy="reposition"` en los selects nuevos como refuerzo. Si un select nuevo "no hace nada" al abrirse, empezar por acá.
- **Servicios compartidos clave** (`src/app/shared/services/` y equivalentes en `features/`):
  - `AuthService`: sesión en signals, token en `localStorage`.
  - `SocketService`: conexión socket.io, `onOrderPaid`/`offOrderPaid` (recordar hacer `off` en `ngOnDestroy` para no acumular listeners).
  - `ExchangeRateService`: tasa BCV, ver arriba.
  - `ToastService`: envuelve `NbToastrService` (`.success()`, `.warning()`, `.error()`).
- Los toasts se usan para avisos puntuales (ej. "orden creada"), **no** para el estado de sospecha de una orden — eso vive en el color/texto del renglón porque es persistente, un toast desaparece.

## 7. Cosas que se investigaron y quedaron resueltas (para no repetir el diagnóstico)

- `awsBucketS3.ts` creaba el `S3Client` al cargar el módulo; sin `AWS_REGION` tumbaba el servidor apenas algo lo importaba. Se hizo lazy (`getS3Client()`).
- Los valores `DECIMAL` de MySQL llegan como **string** por `sequelize.query` crudo (ej. `"50.00"`), no como número JS. La multiplicación (`"50.00" * rate`) igual funciona por coerción implícita, pero si se necesita comparar tipos hay que tenerlo presente.
- El proceso de `ng serve` de larga duración, después de muchísimas ediciones en caliente, puede quedar sirviendo un bundle viejo (síntoma: "esto no hace nada" o errores de referencias a código que ya no existe). Solución: matar el proceso en el puerto 4200 y levantar uno nuevo (`npx ng serve --port 4200`).

## 8. Pendientes conocidos (explícitamente no resueltos)

- **`atrasado` no se activa solo con el tiempo.** Hoy es un estado que solo se cambia a mano; falta un job/cron que revise órdenes viejas en "En espera" y las pase a "Atrasado".
- **No hay tabla de permisología granular** — el control de acceso es por `role.slug` harcodeado en cada controlador.
- **AWS S3 no está configurado** (variables vacías en `.env`) — se usa el fallback a disco local.
- **`link_subscriptions`** (tabla de tenant) existe desde el esquema original pero **no se usa en ningún endpoint todavía** — su propósito original (¿suscripciones recurrentes ligadas a una orden?) nunca se terminó de definir.
- La sesión vive en `localStorage`, no en cookie `httpOnly` — vulnerable a XSS en teoría; aceptado como simplificación por ahora.
- No hay refresh token; el JWT dura 8h y después hay que volver a iniciar sesión.

## 9. Variables de entorno (`pasalo.api/.env`)

```
PORT, NODE_ENV
DB_HOST, DB_PORT, DB_NAME=pasalo-master, DB_USER, DB_PASS
JWT_SECRET
AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY   (vacías hoy)
PAYMENT_BASE_URL     → base del link público, ej. http://localhost:4200/p
API_PUBLIC_URL       → base para servir /uploads en local
```

Frontend (`pasalo.ve/src/environments/environment.ts`): `host` (API + `/api`) y `socketHost` (API sin `/api`, para el websocket).

## 10. Cuentas de prueba (datos de desarrollo, no reales)

- Empresa **"coffee code"** — admin: `slouis482@gmail.com`.
- Empresa **"Pasalo Demo CA"** (tenant `pasalodemo`) — admin: `ana@gmail.com` / `clave1234`; vendedor: `carlos@tienda.com` / `clave1234`; soporte: `marta@tienda.com` / `clave1234`.
