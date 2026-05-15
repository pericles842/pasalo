// src/middlewares/errorHandler.ts
import { ErrorRequestHandler } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { MulterError } from 'multer';
import { UniqueConstraintError, ValidationError, DatabaseError, AccessDeniedError, ForeignKeyConstraintError } from 'sequelize';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof UniqueConstraintError) {
    const value = err.errors[0]?.value;
    res.status(400).json({
      message: err.errors[0].message,
      error: `El valor '${value}' ya está registrado, por favor ingresa otro.`
    });

    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      message: 'Error interno del servidor',
      error: err.message
    });
    return;
  }

  if (err instanceof DatabaseError) {
    if (err instanceof ForeignKeyConstraintError) {
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

  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      message: 'Error interno del servidor',
      error: err.message
    });
  }

  if (err instanceof MulterError) {
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
