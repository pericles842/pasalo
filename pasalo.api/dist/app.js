"use strict";
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Configuración de CORS para permitir peticiones desde otros orígenes
app.use((0, cors_1.default)({
    origin: "*",
}));
// Middlewares
app.use(express_1.default.json());
//cokie parser Only
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, morgan_1.default)("dev")); //'dev' o 'combined' para más info
// View engine (EJS) — quítalo si solo será API
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
// Middlewares
// Agregar timestamps
//app.use(addTimestamps);
// Rutas API
app.use("/api/", routes_1.default);
app.get("/", (req, res) => {
    res.render("home", { title: "Home" });
});
//manejo de errores
app.use(errorHandler_1.errorHandler);
const port = process.env.PORT || 3000;
const server = app.listen(port, async () => {
    try {
        await db_1.sequelize.authenticate();
        const address = (0, systemFunctions_1.getLocalIp)();
        const actualPort = server.address().port;
        console.log(chalk_1.default.hex("#FF69B4")("🟢 Conectado a Mysql"));
        console.log(chalk_1.default.hex("#FF69B4")(`🟢 Servidor listo en http://${address}:${actualPort}`));
    }
    catch (error) {
        console.log(chalk_1.default.red("Hubo un problema"), error);
    }
});
