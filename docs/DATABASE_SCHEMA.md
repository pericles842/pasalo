# Pásalo — Esquema de base de datos

> Extraído en vivo de las bases de datos reales (`pasalo-master` y una base tenant representativa, `pasalo_pasalodemo`) el 21 de agosto de 2026. Ver [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) para entender por qué hay dos "tipos" de base de datos.

## Parte 1 — Base master: `pasalo-master`

Una sola instancia, compartida por toda la plataforma. Guarda quiénes son las empresas clientes, quiénes son las personas que las usan, y el catálogo de planes/roles/estados.

### `companies`
La empresa cliente de Pásalo (el negocio que vende por redes).

| Columna | Tipo | Notas |
|---|---|---|
| `uuid` | char(36) PK | |
| `name` | varchar(255) | Nombre del negocio |
| `logo_url` | varchar(255) NULL | |
| `rif` | varchar(255) UNIQUE | |
| `email` | varchar(255) UNIQUE | Correo de contacto de la empresa (distinto del correo del usuario admin) |
| `tenant_id` | varchar(255) UNIQUE | Identificador corto derivado del dominio; se usa para resolver la conexión a la base del tenant y viaja en la URL pública de pago |
| `domain` | varchar(255) UNIQUE | Dominio que dio la empresa al registrarse; de acá sale `tenant_id` |
| `user_limit` | int, default 0 | **Vestigial**: el límite real de usuarios lo define el plan contratado (`plans.user_limit`), no esta columna |
| `createdAt`/`updatedAt` | datetime | |

### `companies_connections`
Los datos de conexión a la base de datos privada de cada empresa. Es lo que lee `getTenantConnection()` para saber a qué servidor/base conectarse.

| Columna | Tipo | Notas |
|---|---|---|
| `uuid` | char(36) PK | |
| `id_company` | char(36) FK → `companies.uuid` | |
| `db_name` | varchar(255) | `pasalo_<tenant_id>` |
| `db_host`, `db_port`, `db_user`, `db_password` | | Credenciales de conexión (hoy siempre el mismo MySQL local, un `db_name` distinto por fila) |
| `createdAt`/`updatedAt` | datetime | |

### `plans`
Catálogo fijo de planes de suscripción (no cambia por empresa).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `name`, `description` | varchar | |
| `price` | double | En USD |
| `user_limit` | int, default 1 | **Este es el límite real** que se compara contra la cantidad de filas en `company_users` al crear un usuario nuevo |
| `color_theme` | varchar | Hex, para pintar el badge del plan en el frontend |
| `createdAt`/`updatedAt` | datetime | |

Datos actuales (seed):

| id | name | price | user_limit |
|---|---|---|---|
| 1 | Plan Gratuito | $0 | 2 |
| 2 | Plan Premium | $29 | 3 |
| 3 | Plan Pro | $59 | 5 |
| 4 | Plan Business | $99 | 10 |

### `companies_subscriptions`
Une una empresa con el plan que tiene activo. Una fila por empresa (`company_id` es UNIQUE — no hay historial de cambios de plan, cambiar de plan actualiza la misma fila).

| Columna | Tipo | Notas |
|---|---|---|
| `uuid` | char(36) PK | |
| `company_id` | char(36) UNIQUE FK → `companies.uuid` | |
| `plan_id` | int FK → `plans.id` | |
| `status_id` | int FK → `status_subscriptions.id` | |
| `createdAt`/`updatedAt` | datetime | |

### `status_subscriptions`
Catálogo fijo: `1 Activo`, `2 Suspendido`, `3 Vencido`.

### `roles`
Catálogo fijo de roles internos de una empresa.

| id | name | slug | description |
|---|---|---|---|
| 1 | Administrador | `admin` | Usuario master de la empresa. Gestiona la suscripción y los usuarios internos. |
| 2 | Soporte | `support` | Atiende y valida los pagos recibidos. |
| 3 | Vendedor | `seller` | Genera los links de cobro de la empresa. |

Nota de negocio: al listar roles disponibles para crear un usuario nuevo (`listRoles`), **se excluye explícitamente "Administrador"** — solo puede existir un admin por empresa, el que se creó al registrar la compañía.

### `users`
Una persona con acceso al sistema. Puede pertenecer a una o (en teoría) varias empresas vía `company_users`.

| Columna | Tipo | Notas |
|---|---|---|
| `uuid` | char(36) PK | |
| `first_name` | varchar(255) | |
| `middle_name` | varchar(255) NULL | Apellido (el nombre de columna es engañoso — se usa como apellido en el frontend) |
| `photo_url` | varchar(255) NULL | |
| `ci` | varchar(255) UNIQUE NULL | Cédula |
| `email` | varchar(255) UNIQUE | Correo personal, usado para login |
| `password` | varchar(255) | Hash bcrypt |
| `role_id` | int FK → `roles.id`, default 1 | |
| `status` | enum('active','inactive','baned') | |
| `sales_made` | int, default 0 | Pensado para contarse automáticamente (no manual); **hoy no hay ningún proceso que lo actualice todavía** — quedó como columna preparada para una futura métrica de ventas por vendedor |
| `createdAt`/`updatedAt` | datetime | |

### `company_users`
Tabla puente: qué usuario pertenece a qué empresa.

| Columna | Tipo | Notas |
|---|---|---|
| `uuid` | char(36) PK | |
| `company_id` | char(36) FK → `companies.uuid` | |
| `user_id` | char(36) FK → `users.uuid` | |
| `createdAt`/`updatedAt` | datetime | |

El conteo de filas con un `company_id` dado es lo que se compara contra `plans.user_limit` para saber si se puede crear un usuario más.

### `status_orders`
Catálogo fijo de estados de una orden (se usa en TODAS las bases tenant, referenciado por `orders.status_id` sin FK física porque cruza de base).

| id | name | slug | description |
|---|---|---|---|
| 1 | En espera | `pendiente` | El cliente aún no ha subido su comprobante de pago. |
| 2 | Pagado | `pagado` | El pago fue recibido y validado por el vendedor. |
| 3 | Atrasado | `atrasado` | La orden lleva demasiado tiempo sin pago. **(no hay proceso automático que asigne este estado — ver pendientes en PROJECT_CONTEXT.md)** |
| 4 | Rechazado | `rechazado` | El vendedor revisó el comprobante y lo rechazó. |

### Publicidad: `ads_locations`, `plans_ads`, `plan_ads_locations`, `ads`
Catálogo de ubicaciones de publicidad, los planes que se le venden a empresas anunciantes, la relación N:M entre ambos, y los anuncios contratados concretos. Ver [ADS_CONTEXT.md](./ADS_CONTEXT.md) para el detalle columna por columna, el motor de sorteo y las decisiones de negocio detrás — es un dominio grande, se le dio su propio documento en vez de inflar este.

### `sequelizemeta`
Tabla técnica de Sequelize/Umzug: registra qué archivos de `migrations/*.js` ya se aplicaron a esta base. No se toca a mano.

---

## Parte 2 — Base por tenant: `pasalo_<tenant_id>` (ejemplo real: `pasalo_pasalodemo`)

Una copia de este esquema existe **por cada empresa registrada**. Acá vive la operación diaria: qué se vendió, quién pagó, con qué método. No tiene tablas de usuarios/roles/planes — esas siguen viviendo en master y se referencian por UUID sin FK física (no es posible tener FK de MySQL entre dos bases de datos distintas, así que la integridad se garantiza solo a nivel de aplicación).

### `orders`
El corazón del sistema: una venta.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | char(36) PK | |
| `company_id` | char(36) | Referencia lógica a `pasalo-master.companies.uuid` (redundante con saber en qué base tenant estás, pero se guarda para queries directas) |
| `user_id` | char(36) | Referencia lógica a `pasalo-master.users.uuid` — el vendedor que creó la orden |
| `amount` | decimal(10,2) | Total en **USD**, calculado en el servidor sumando `order_items`, nunca confiado del cliente |
| `first_name_client`, `last_name_client`, `ci_client`, `phone_client`, `address_client`, `email_client` | varchar/text | Datos del comprador. `last_name_client`, `ci_client`, `phone_client`, `address_client` son NOT NULL; `first_name_client` y `email_client` son opcionales |
| `reference` | varchar(100) NULL | Referencia de pago ingresada a mano (poco usado, ver `extracted_reference`) |
| `notes` | text NULL | Observaciones generales de la orden |
| `status_id` | int, default 1 | Referencia lógica a `status_orders.id` (master) |
| `payment_method_id` | int NULL | Referencia lógica a `payment_methods.id` (de esta misma base tenant) — el método que eligió el comprador al pagar |
| `receipt_url` | varchar(500) NULL | Ruta/URL de la foto del comprobante subida |
| `extracted_reference` | varchar(100) NULL | Referencia leída automáticamente del comprobante por OCR |
| `extracted_amount` | decimal(10,2) NULL | Monto leído automáticamente del comprobante por OCR |
| `is_suspicious` | tinyint(1), default 0 | `true` si `extracted_amount` no coincidió (±3%) con `amount` esperado al momento del pago |
| `extracted_raw_text` | text NULL | Texto completo que devolvió Tesseract, guardado para poder revisar/depurar casos raros a mano |
| `paid_at` | datetime NULL | Se estampa la primera vez que `status_id` pasa a 2 (Pagado) |
| `pay_url_token` | char(36) UNIQUE | El UUID que identifica el link público de pago: `/p/:tenant_id/:pay_url_token` |
| `createdAt`/`updatedAt` | datetime | |

### `order_items`
Los renglones de productos de una orden (relación 1 a muchos con `orders`).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | char(36) PK | |
| `order_id` | char(36) FK → `orders.id` | |
| `name` | varchar(255) | Nombre del producto |
| `reference` | varchar(100) NULL | Referencia/SKU del producto |
| `price` | decimal(10,2) | Precio en USD de ese renglón |
| `createdAt`/`updatedAt` | datetime | |

### `payment_methods`
Los métodos de cobro que configuró la empresa (solo el admin puede crear/borrar).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | int PK autoincrement | |
| `company_id` | char(36) | Referencia lógica a `companies.uuid` |
| `name` | varchar(255) NULL | Nombre visible, ej. "Pago Móvil Banesco" |
| `type` | enum('pagomovil','transferencia','billetera_digital') NULL | Determina qué campos pide el formulario y si el monto a comparar debe convertirse a Bs (`pagomovil`/`transferencia`) o queda en USD (`billetera_digital`, ej. Zelle/Binance) |
| `datos` | longtext NULL | JSON libre según `type` (banco/teléfono/cédula para pagomóvil, banco/cuenta/cédula para transferencia, correo para billetera digital) |
| `titular` | varchar(255) NULL | Nombre del titular de la cuenta |
| `url_img` | varchar(255) NULL | Logo/ícono del método (no muy usado aún) |
| `createdAt`/`updatedAt` | datetime | |

### `notifications`
El historial persistente de pagos recibidos — lo que ve la campana y la pantalla "Historial de notificaciones". Es distinto del evento de websocket (el websocket es el aviso en vivo; esta tabla es lo que queda después).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | char(36) PK | |
| `company_id` | char(36) | Referencia lógica a `companies.uuid` |
| `order_id` | char(36) FK → `orders.id` | |
| `seller_id` | char(36) | Referencia lógica a `users.uuid` — dueño de la orden, usado para filtrar "mis notificaciones" |
| `buyer_name` | varchar(255) | Copia del nombre del comprador al momento del pago (denormalizado a propósito, para no tener que hacer join con `orders` en cada listado) |
| `amount` | decimal(10,2) | Monto de la orden |
| `reference` | varchar(100) NULL | Referencia detectada por OCR |
| `is_suspicious` | tinyint(1), default 0 | Copia del flag de la orden al momento del pago |
| `createdAt` | datetime | (esta tabla no tiene `updatedAt` — es un registro de un evento puntual, nunca se edita) |

### `link_subscriptions` — existe pero **no se usa**
| Columna | Tipo | Notas |
|---|---|---|
| `id` | char(36) PK | |
| `order_id` | char(36) UNIQUE FK → `orders.id` | |
| `start_date`, `end_date` | date NULL | |
| `createdAt`/`updatedAt` | datetime | |

Quedó del esquema original (DBML inicial del proyecto). Ningún controlador actual la lee ni la escribe. Lo más probable, por su forma (`order_id` único + rango de fechas), es que estaba pensada para **cobros recurrentes/suscripciones ligadas a una orden** (ej. "vender" una membresía mensual), pero esa funcionalidad nunca se construyó en esta etapa del proyecto. Si se retoma, hay que decidir primero el flujo de negocio antes de escribirle código.

### `sequelizemeta`
Igual que en master: registra qué migraciones de `migrations/pasalo-client/*.js` ya corrieron **en esta base tenant específica**. Cada empresa tiene su propio avance — por eso hace falta `npm run migrate:tenants` para ponerlas a todas al día cuando se agrega una migración nueva (ver PROJECT_CONTEXT.md § 3).

---

## Relaciones entre master y tenant (resumen visual)

```
pasalo-master                              pasalo_<tenant_id>  (una copia por empresa)
──────────────                             ───────────────────
companies ──┬── companies_connections      orders ──┬── order_items
            ├── companies_subscriptions ┐            ├── payment_methods (FK real, misma base)
            └── company_users ──┐        │           ├── notifications
                                 │        │           └── link_subscriptions (sin uso)
users ───────────────────────────┘        │
  └── roles (role_id)                     │
                                            └── plans (vía companies_subscriptions.plan_id)
status_orders ⟶ referenciado por orders.status_id (lógico, cruza de base)
status_subscriptions ⟶ referenciado por companies_subscriptions.status_id
```

Todas las flechas que cruzan de `pasalo-master` a una base tenant (o viceversa) son **referencias lógicas por UUID**, no claves foráneas de MySQL — no hay forma de que la base las valide sola; la integridad depende de que el código del backend siempre escriba UUIDs que existan del otro lado.
