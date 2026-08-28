# Pásalo — Registro de vulnerabilidades y deuda de seguridad

> Backlog de riesgos identificados pero no explotados ni urgentes. No implica que el sistema esté comprometido hoy — es para no perder el hallazgo y priorizarlo cuando el contexto (tamaño del equipo, tráfico, superficie de ataque) lo justifique.

---

## 2026-08-28 — Usuario único de MySQL con privilegios de CREATE/DROP DATABASE

**Estado:** Pendiente — no explotado, prioridad baja mientras MySQL esté privado dentro de Docker y sin exposición pública.

**Severidad:** Media (alto impacto potencial, baja probabilidad actual).

### Descripción

El backend usa una única credencial de MySQL (`DB_USER`/`DB_PASS`, hoy `t67813d` en producción) para **todo**:

- Queries normales de negocio sobre `pasalo-master` y sobre cada `pasalo_<tenant_id>`.
- `CREATE DATABASE` al registrar una empresa nueva.
- `DROP DATABASE` al hacer rollback de un registro fallido.
- Crear las tablas de cada tenant (migraciones vía Umzug).

Archivos/líneas involucrados:

- [`pasalo.api/src/app/models/company.model.ts:91`](../pasalo.api/src/app/models/company.model.ts#L91) — `CREATE DATABASE`
- [`pasalo.api/src/app/models/company.model.ts:119`](../pasalo.api/src/app/models/company.model.ts#L119) — `DROP DATABASE`
- [`pasalo.api/src/app/config/db.ts`](../pasalo.api/src/app/config/db.ts) — conexión Sequelize única, mismo usuario para todo
- [`pasalo.api/src/app/controllers/company.controller.ts:130-138`](../pasalo.api/src/app/controllers/company.controller.ts#L130-L138) — dispara `createConnectionCompany`/`dropConnectionCompany`

### ¿Qué vulnerabilidad estamos evitando a futuro?

Si `t67813d` tiene permisos para crear/eliminar bases, y algún día apareciera una vulnerabilidad en la API que permitiera ejecutar SQL arbitrario (ej. una inyección SQL, un endpoint mal validado, una dependencia comprometida), un atacante podría usar esas mismas credenciales para, por ejemplo:

```sql
DROP DATABASE pasalo_papita;
```

o manipular/leer otras bases de tenants a las que `t67813d` tenga acceso — no solo la de la empresa afectada por el bug, sino potencialmente **todas**, porque el mismo usuario las administra todas.

Esto no significa que exista esa vulnerabilidad hoy. Es una razón para, cuando Pásalo crezca, separar:

- **API → usuario de negocio** (SELECT/INSERT/UPDATE/DELETE sobre `pasalo-master` y sobre las DBs de tenant ya creadas, sin `CREATE`/`DROP DATABASE`).
- **API → usuario de provisioning** (solo `CREATE`/`DROP` sobre `pasalo_%`, usado únicamente en `createConnectionCompany`/`dropConnectionCompany`).

Por ahora se prioriza simplicidad + funcionamiento, manteniendo MySQL privado dentro de Docker (sin puerto expuesto a internet), lo cual reduce mucho la probabilidad de explotación aunque no elimina el riesgo si el vector de entrada es la propia API.

### Solución propuesta (ver análisis completo en el historial de la conversación del 2026-08-28)

1. Crear un segundo usuario MySQL (ej. `pasalo_admin`) con `CREATE, DROP, CREATE TABLE` sobre `pasalo_%`, y revocarle esos privilegios a `t67813d`.
2. Agregar `DB_ADMIN_USER`/`DB_ADMIN_PASS` al `.env` / Dokploy.
3. Nueva conexión Sequelize admin (`src/app/config/dbAdmin.ts`) usada solo en `createConnectionCompany` y `dropConnectionCompany`.
4. La fila guardada en `companies_connections` (usada por `getTenantConnection` en cada request) sigue guardando las credenciales del usuario de **negocio**, nunca las del admin.
5. Decidir si `generateTablesForCompanyClient` (crea las tablas dentro de la DB ya creada) corre con el usuario de negocio (si tiene `CREATE TABLE` sobre `pasalo_%`) o también con el admin.

### Disparador para priorizar esto

Revisar cuando ocurra cualquiera de estos:
- MySQL deja de estar aislado en Docker (se expone un puerto, se migra a un motor gestionado accesible desde fuera de la red interna).
- Se suma más de una persona con acceso a credenciales de producción.
- Se agrega algún endpoint que construya SQL dinámico o ejecute queries con input del usuario sin pasar por el ORM.
