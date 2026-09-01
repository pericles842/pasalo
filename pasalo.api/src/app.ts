// src/app.ts
import './app/config/env'; // primero: carga el .env antes que cualquier modulo que lea process.env
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';

import { sequelize } from './app/config/db';
import routes from './routes';
import path from 'path';
import cors from 'cors';

import morgan from 'morgan';
import chalk from 'chalk';
import { getLocalIp } from './utils/systemFunctions';
import { initSocket } from './app/config/socket';
import { getCorsOrigins } from './app/config/cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';


const isDev = process.env.NODE_ENV === 'development';

const app = express();

// Configuración de CORS para permitir peticiones desde otros orígenes

app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // explícito
    allowedHeaders: ['Content-Type', 'Authorization', 'module_id'], // explícito
    exposedHeaders: ['Content-Disposition'], 
  })
);
// Middlewares
app.use(express.json());

//cokie parser Only
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); //'dev' o 'combined' para más info

// View engine (EJS) — quítalo si solo será API
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
// Agregar timestamps
//app.use(addTimestamps);

// Comprobantes y logos mientras no hay AWS configurado (ver src/utils/storage.ts)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Documentación Swagger, solo disponible en development
if (isDev) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Rutas API
app.use('/api/', routes);

app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

//manejo de errores
app.use(errorHandler);
const port = process.env.PORT || 3000;

const server = app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    initSocket(server);
    const address = getLocalIp();
    const server_address = server.address();
    const actualPort = typeof server_address === 'object' && server_address ? server_address.port : port;

    console.log(chalk.hex('#FF69B4')('🟢 Conectado a Mysql'));
    console.log(chalk.hex('#FF69B4')(`🟢 Servidor listo en http://${address}:${actualPort}`));
    console.log(chalk.hex('#FF69B4')(`🟢 CORS habilitado para: ${getCorsOrigins().join(', ')}`));

    if (isDev) {
      const docsUrl = `http://localhost:${actualPort}/api-docs`;
      console.log(chalk.hex('#FF69B4')(`📘 Documentación disponible en ${docsUrl}`));
      const open = (await import('open')).default;
      open(docsUrl).catch(() => {
        console.log(chalk.yellow(`No se pudo abrir el navegador automáticamente. Abre manualmente: ${docsUrl}`));
      });
    }
  } catch (error) {
    console.log(chalk.red('Hubo un problema'), error);
  }
});
