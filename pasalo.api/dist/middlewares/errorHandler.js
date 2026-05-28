"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const multer_1 = require("multer");
const sequelize_1 = require("sequelize");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof sequelize_1.UniqueConstraintError) {
        const value = err.errors[0]?.value;
        res.status(400).json({
            message: err.errors[0].message,
            error: `El valor '${value}' ya está registrado, por favor ingresa otro.`
        });
        return;
    }
    if (err instanceof sequelize_1.ValidationError) {
        res.status(400).json({
            message: 'Error interno del servidor',
            error: err.message
        });
        return;
    }
    if (err instanceof sequelize_1.DatabaseError) {
        if (err instanceof sequelize_1.ForeignKeyConstraintError) {
            res.status(400).json({
                message: 'Error de clave foránea.',
                error: `El recurso no puede eliminarse o modificarse porque está siendo utilizado por otro registro.
        elimina el registro para continuar.`
            });
            return;
        }
        res.status(500).json({
            message: 'Error en la base de datos.',
            error: err.name,
            sqlError: err
        });
        return;
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        res.status(401).json({
            message: 'Error interno del servidor',
            error: err.message
        });
    }
    if (err instanceof multer_1.MulterError) {
        res.status(500).json({
            message: 'Error interno del servidor',
            error: err.message
        });
    }
    // if (err instanceof SequelizeValidationError) {
    //   res.status(500).json({
    //     message: 'Error interno del servidor',
    //     error: err.message
    //   });
    // }
    res.status(500).json({
        message: 'Error interno del servidor',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err
    });
};
exports.errorHandler = errorHandler;
