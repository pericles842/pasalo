// src/app.ts
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';

import { sequelize } from './app/config/db';
import routes from './routes';
import path from 'path';
import cors from 'cors';

import dotenv from 'dotenv';
import morgan from 'morgan';
import chalk from 'chalk';
import { getLocalIp } from './utils/systemFunctions';
import { initSocket } from './app/config/socket';

dotenv.config();

const app = express();

// Configuración de CORS para permitir peticiones desde otros orígenes

app.use(
  cors({
    origin: ['*'],
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
    const actualPort = (server.address() as any).port;

    console.log(chalk.hex('#FF69B4')('🟢 Conectado a Mysql'));
    console.log(chalk.hex('#FF69B4')(`🟢 Servidor listo en http://${address}:${actualPort}`));
  } catch (error) {
    console.log(chalk.red('Hubo un problema'), error);
  }
});
