# CONTEXTO — Infraestructura VPS y despliegue de Pásalo

## 1. Proyecto

**Pásalo** es una aplicación SaaS multi-tenant.

La aplicación tiene:

* Frontend: Angular
* Backend: Node.js + Express + TypeScript
* ORM: Sequelize
* Migraciones: Umzug
* Base de datos: MySQL 8.4.11
* Contenedores: Docker
* Orquestación: Docker Swarm
* Plataforma de despliegue: Dokploy
* Red Docker: `dokploy-network`

La arquitectura utiliza una base de datos principal (`pasalo-master`) y crea automáticamente una base independiente para cada empresa/tenant.

Ejemplos:

```text
pasalo-master
pasalo_papita
pasalo_empresa2
pasalo_empresa3
...
```

---

# 2. VPS

Pásalo está desplegado en un VPS utilizando:

```text
VPS
└── Docker
    └── Docker Swarm
        └── Dokploy
```

Dokploy administra los servicios y despliegues de la aplicación.

El objetivo actual es mantener una infraestructura económica para la primera fase de Pásalo.

MySQL NO debe exponerse directamente a Internet.

El puerto:

```text
3306
```

se utiliza internamente mediante la red Docker.

---

# 3. Servicios principales

Actualmente existen estos servicios principales:

```text
pasalo-api
pasalo-web
pasalo-master
```

### pasalo-api

Backend de Pásalo:

```text
Node.js
Express
TypeScript
Sequelize
```

Es el servicio que:

* recibe las peticiones de la aplicación;
* administra usuarios;
* administra empresas;
* administra suscripciones;
* conecta con `pasalo-master`;
* crea las bases de datos de los tenants;
* ejecuta migraciones de cada tenant;
* conecta posteriormente con cada base de tenant.

---

### pasalo-web

Frontend:

```text
Angular
```

Es la aplicación web utilizada por los usuarios.

---

### pasalo-master

Base de datos principal:

```text
MySQL 8.4.11
```

Nombre:

```text
pasalo-master
```

Host interno Docker:

```text
db-pasalo-master-a702iz
```

Puerto:

```text
3306
```

IP interna observada:

```text
10.0.1.8
```

Está conectada a:

```text
dokploy-network
```

El API puede comunicarse correctamente con MySQL mediante esta red.

Se verificó conectividad:

```text
10.0.1.8:3306 open
```

Por lo tanto, los problemas anteriores NO eran de:

* DNS interno;
* Docker network;
* puerto;
* conectividad entre API y MySQL.

---

# 4. Conexión del backend

La conexión principal de Sequelize está definida en:

```text
src/app/config/db.ts
```

Utiliza:

```env
DB_HOST=db-pasalo-master-a702iz
DB_PORT=3306
DB_NAME=pasalo-master
DB_USER=t67813d
DB_PASS=...
```

En desarrollo el usuario podía ser `root`, pero en producción se utiliza:

```text
t67813d
```

La conexión global `sequelize` apunta a:

```text
pasalo-master
```

---

# 5. Usuario MySQL utilizado por Pásalo

El usuario de producción es:

```text
t67813d@%
```

Actualmente tiene:

```sql
GRANT CREATE, DROP ON *.* TO 't67813d'@'%';

GRANT ALL PRIVILEGES
ON `pasalo-master`.*
TO 't67813d'@'%';

GRANT ALL PRIVILEGES
ON `pasalo\_%`.*
TO 't67813d'@'%';
```

Los permisos fueron comprobados mediante:

```sql
SHOW GRANTS FOR 't67813d'@'%';
```

Resultado actual:

```text
GRANT CREATE, DROP ON *.* TO `t67813d`@`%`
GRANT ALL PRIVILEGES ON `pasalo-master`.* TO `t67813d`@`%`
GRANT ALL PRIVILEGES ON `pasalo\_%`.* TO `t67813d`@`%`
```

Esto permite actualmente:

### Sobre `pasalo-master`

Operaciones completas:

```text
SELECT
INSERT
UPDATE
DELETE
CREATE TABLE
ALTER TABLE
DROP TABLE
etc.
```

### Sobre bases de tenants `pasalo_*`

Operaciones completas:

```text
SELECT
INSERT
UPDATE
DELETE
CREATE TABLE
ALTER TABLE
DROP TABLE
etc.
```

### Globalmente

Además:

```text
CREATE DATABASE
DROP DATABASE
```

---

# 6. Usuario root

MySQL también tiene:

```text
root
```

`root` es el usuario administrativo de MySQL.

NO es utilizado actualmente por la API en producción.

Se utiliza únicamente para:

* entrar manualmente al servidor MySQL;
* revisar permisos;
* realizar tareas administrativas;
* solucionar problemas de infraestructura.

No se debe colocar la contraseña de `root` en el código ni utilizarla como `DB_USER` de producción.

---

# 7. Problema original de MySQL

Originalmente Pásalo intentaba ejecutar:

```sql
DROP DATABASE IF EXISTS `pasalo_papita`
```

utilizando:

```text
t67813d
```

MySQL respondía:

```text
ER_DBACCESS_DENIED_ERROR
errno: 1044
```

con:

```text
Access denied for user 't67813d'@'%' to database 'pasalo_papita'
```

La causa era que originalmente `t67813d` solamente tenía:

```sql
GRANT ALL PRIVILEGES
ON `pasalo-master`.*
TO 't67813d'@'%';
```

Por lo tanto tenía control sobre `pasalo-master`, pero no podía crear/eliminar otras bases.

---

# 8. Solución aplicada

Se decidió mantener por ahora una arquitectura sencilla:

```text
t67813d
```

continúa siendo el usuario utilizado por toda la aplicación.

No se creó todavía un usuario separado como:

```text
pasalo_admin
```

La razón es simplificar la primera fase de Pásalo.

Se otorgó:

```sql
GRANT CREATE, DROP ON *.* TO 't67813d'@'%';
```

Con esto se solucionó la capacidad de:

```text
CREATE DATABASE
DROP DATABASE
```

La prueba manual desde MySQL confirmó que el usuario puede crear una base.

---

# 9. Segundo problema encontrado

Después de resolver `CREATE DATABASE` / `DROP DATABASE`, la API produjo:

```text
ER_TABLEACCESS_DENIED_ERROR
errno: 1142
```

con:

```text
SELECT command denied to user 't67813d'@'10.0.1.25'
for table 'SequelizeMeta'
```

La consulta que fallaba era:

```sql
SHOW INDEX FROM `SequelizeMeta`
```

Esto ocurría durante las migraciones del tenant.

La razón era que:

```text
pasalo-master.*
```

no daba permisos sobre:

```text
pasalo_papita.*
```

Se solucionó agregando:

```sql
GRANT ALL PRIVILEGES
ON `pasalo\_%`.*
TO 't67813d'@'%';
```

Actualmente el `SHOW GRANTS` confirma que este permiso está aplicado.

---

# 10. Arquitectura multi-tenant

Cada empresa tiene su propia base.

Ejemplo:

```text
pasalo-master
      │
      ├── company
      ├── user
      ├── company_user
      ├── subscription
      └── companies_connections
```

Y cada tenant:

```text
pasalo_papita
pasalo_empresa2
pasalo_empresa3
...
```

contiene sus propias tablas.

---

# 11. Creación de tenants

El código responsable está principalmente en:

```text
src/app/models/company.model.ts
```

Método:

```text
CompanyModel.createConnectionCompany(company)
```

Actualmente ejecuta:

```sql
CREATE DATABASE `pasalo_<tenant_id>`
```

utilizando la instancia global:

```text
sequelize
```

que utiliza:

```text
DB_USER=t67813d
DB_PASS=...
```

---

# 12. Eliminación de tenants

En el mismo archivo:

```text
src/app/models/company.model.ts
```

Método:

```text
CompanyModel.dropConnectionCompany(tenant_id)
```

ejecuta:

```sql
DROP DATABASE IF EXISTS `pasalo_<tenant_id>`
```

También utiliza:

```text
sequelize
```

y por lo tanto:

```text
t67813d
```

---

# 13. Flujo de registro de empresa

El controlador principal está en:

```text
src/app/controllers/company.controller.ts
```

Método:

```text
registerCompanyProcess
```

El flujo es aproximadamente:

```text
1. Crear company
2. Crear user
3. Crear company_user
4. Crear subscription
5. COMMIT
6. CREATE DATABASE tenant
7. Crear tablas del tenant mediante migraciones
```

Las sentencias DDL de MySQL hacen commit implícito, por eso la creación de la base se realiza fuera de la transacción principal.

Si posteriormente falla el provisioning, el código intenta limpiar:

```text
DROP DATABASE
company.destroy()
user.destroy()
```

---

# 14. Migraciones de tenants

Existe:

```text
generateTablesForCompanyClient(db_client)
```

en:

```text
src/app/models/company.model.ts
```

Este método NO crea la base de datos.

La base ya debe existir.

Luego crea una nueva conexión Sequelize apuntando a:

```text
pasalo_<tenant_id>
```

y ejecuta las migraciones:

```text
migrations/pasalo-client/*.js
```

mediante:

```text
Umzug
```

Estas migraciones crean:

```text
SequelizeMeta
```

y las tablas necesarias del tenant.

Por eso `t67813d` necesita permisos sobre:

```text
pasalo_*.*
```

---

# 15. Conexiones de tenants

La lógica está en:

```text
src/app/config/tenant.ts
```

Función:

```text
getTenantConnection(tenant_id)
```

El sistema:

```text
1. Busca una conexión en un Map en memoria.
2. Si no existe, consulta companies_connections.
3. Obtiene:
   db_name
   db_host
   db_port
   db_user
   db_password
4. Crea una nueva instancia Sequelize.
5. Guarda la conexión en cache.
```

---

# 16. companies_connections

Cuando se crea un tenant se guarda información como:

```text
db_name
db_host
db_port
db_user
db_password
```

Actualmente `db_user` y `db_password` se obtienen de:

```text
process.env.DB_USER
process.env.DB_PASS
```

Por lo tanto, los tenants creados actualmente almacenan:

```text
db_user = t67813d
```

Esto es intencional.

NO se debe colocar el usuario `root` en esta tabla.

Tampoco se debe colocar un futuro usuario administrativo de provisioning.

Las conexiones normales de los tenants deben utilizar el usuario de negocio:

```text
t67813d
```

---

# 17. Importante sobre cambio de credenciales

`getTenantConnection()` NO lee `DB_USER` y `DB_PASS` nuevamente cada vez.

Las credenciales fueron copiadas a:

```text
companies_connections
```

cuando se creó el tenant.

Por lo tanto, si en el futuro se cambia:

```env
DB_USER
DB_PASS
```

los tenants existentes seguirán teniendo las credenciales antiguas guardadas en:

```text
companies_connections
```

hasta actualizarlas.

Esto debe tenerse en cuenta antes de cambiar las credenciales de producción.

---

# 18. Red y seguridad

MySQL debe permanecer privado.

No abrir:

```text
0.0.0.0:3306
```

a Internet.

La comunicación debe continuar:

```text
pasalo-api
     │
     │ dokploy-network
     ▼
db-pasalo-master-a702iz:3306
```

La conectividad interna ya fue comprobada correctamente.

---

# 19. Consideración de seguridad futura

Actualmente:

```text
t67813d
```

tiene permisos globales:

```sql
CREATE
DROP
```

Esto permite que la API pueda crear/eliminar bases.

Es una decisión consciente para simplificar la primera fase.

Sin embargo, posteriormente sería mejor separar:

```text
t67813d
```

para operaciones normales y:

```text
pasalo_admin
```

para:

```text
CREATE DATABASE
DROP DATABASE
```

Así una vulnerabilidad de SQL injection o ejecución arbitraria en la API no tendría directamente acceso a las operaciones de provisioning.

Por ahora NO se está implementando esa separación.

---

# 20. Estado actual

### Infraestructura

```text
VPS
└── Docker
    └── Docker Swarm
        └── Dokploy
            ├── pasalo-web
            ├── pasalo-api
            └── pasalo-master
```

### Base de datos

```text
MySQL 8.4.11
```

### Red

```text
dokploy-network
```

### MySQL

```text
Host interno:
db-pasalo-master-a702iz

IP interna observada:
10.0.1.8

Puerto:
3306
```

### Usuarios

```text
root
└── administración manual

t67813d
├── pasalo-master.*
├── pasalo_*.*
├── CREATE DATABASE
└── DROP DATABASE
```

### Estado de permisos

```text
CREATE DATABASE              ✅
DROP DATABASE                ✅
Acceso pasalo-master         ✅
Acceso bases pasalo_*        ✅
CREATE TABLE tenants         ✅
SELECT SequelizeMeta         ✅
```

### Problemas de conectividad

```text
API → MySQL                  ✅
Docker network               ✅
Puerto interno 3306         ✅
```

### Problema que se está probando ahora

Se debe volver a probar el flujo completo de creación de empresa desde la API después de los nuevos permisos:

```text
registrar empresa
      ↓
crear registros master
      ↓
CREATE DATABASE pasalo_xxx
      ↓
conectar tenant
      ↓
ejecutar migraciones
      ↓
crear SequelizeMeta
      ↓
crear tablas
      ↓
tenant funcionando
```

Si aparece otro error, analizarlo como un problema nuevo de permisos/migraciones y NO asumir que sigue siendo un problema de conectividad.

---

# OBJETIVO ACTUAL

Conseguir que el provisioning automático de tenants funcione completamente en producción utilizando:

```text
DB_USER=t67813d
```

sin abrir MySQL a Internet y sin utilizar `root` desde la aplicación.

La separación de un usuario administrativo (`pasalo_admin`) queda como una mejora futura de seguridad.
