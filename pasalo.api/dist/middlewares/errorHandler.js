"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const sequelize_1 = require("sequelize");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof sequelize_1.UniqueConstraintError) {
        const value = err.errors[0]?.value;
        res.status(400).json({
            message: `El valor '${value}' ya está registrado, por favor ingresa otro.`,
            error: err.errors[0].message,
        });
        return;
    }
    if (err instanceof sequelize_1.ValidationError) {
        res.status(400).json({
            message: err.errors.map((e) => e.message).join(", "),
        });
        return;
    }
    if (err instanceof sequelize_1.DatabaseError) {
        res.status(500).json({
            message: "Error en la base de datos.",
            error: err,
        });
        return;
    }
    res.status(500).json({
        message: "Error interno del servidor",
        error: err,
    });
};
exports.errorHandler = errorHandler;
