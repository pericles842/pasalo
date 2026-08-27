"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middlewares/errorHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./app/config/db");
const routes_1 = __importDefault(require("./routes"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const chalk_1 = __importDefault(require("chalk"));
const systemFunctions_1 = require("./utils/systemFunctions");
const socket_1 = require("./app/config/socket");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
dotenv_1.default.config();
const isDev = process.env.NODE_ENV === 'development';
const app = (0, express_1.default)();
// Configuración de CORS para permitir peticiones desde otros orígenes
app.use((0, cors_1.default)({
    origin: ['http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // explícito
    allowedHeaders: ['Content-Type', 'Authorization', 'module_id'], // explícito
    exposedHeaders: ['Content-Disposition'],
}));
// Middlewares
app.use(express_1.default.json());
//cokie parser Only
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, morgan_1.default)('dev')); //'dev' o 'combined' para más info
// View engine (EJS) — quítalo si solo será API
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// Middlewares
// Agregar timestamps
//app.use(addTimestamps);
// Comprobantes y logos mientras no hay AWS configurado (ver src/utils/storage.ts)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Documentación Swagger, solo disponible en development
if (isDev) {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
}
// Rutas API
app.use('/api/', routes_1.default);
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});
//manejo de errores
app.use(errorHandler_1.errorHandler);
const port = process.env.PORT || 3000;
const server = app.listen(port, async () => {
    try {
        await db_1.sequelize.authenticate();
        (0, socket_1.initSocket)(server);
        const address = (0, systemFunctions_1.getLocalIp)();
        const server_address = server.address();
        const actualPort = typeof server_address === 'object' && server_address ? server_address.port : port;
        console.log(chalk_1.default.hex('#FF69B4')('🟢 Conectado a Mysql'));
        console.log(chalk_1.default.hex('#FF69B4')(`🟢 Servidor listo en http://${address}:${actualPort}`));
        if (isDev) {
            const docsUrl = `http://localhost:${actualPort}/api-docs`;
            console.log(chalk_1.default.hex('#FF69B4')(`📘 Documentación disponible en ${docsUrl}`));
            const open = (await Promise.resolve().then(() => __importStar(require('open')))).default;
            open(docsUrl).catch(() => {
                console.log(chalk_1.default.yellow(`No se pudo abrir el navegador automáticamente. Abre manualmente: ${docsUrl}`));
            });
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('Hubo un problema'), error);
    }
});
