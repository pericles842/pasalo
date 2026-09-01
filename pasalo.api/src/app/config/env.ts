/**
 * Carga el .env antes que cualquier otro módulo. Se importa primero en app.ts
 * porque los imports se evaluan antes que los statements: un dotenv.config()
 * escrito mas abajo corre tarde y los modulos que leen process.env al
 * importarse ya vieron el entorno vacio.
 *
 * La ruta es absoluta porque dotenv resuelve contra el cwd del proceso, y en
 * produccion (pm2 / systemd) el cwd no siempre es la raiz del proyecto.
 */
import path from 'path';
import dotenv from 'dotenv';

// src/app/config y dist/app/config quedan ambos a tres niveles de la raiz.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Respaldo por si el .env vive junto al cwd. dotenv nunca pisa lo ya definido,
// asi que las variables reales del sistema siguen teniendo prioridad.
dotenv.config();
