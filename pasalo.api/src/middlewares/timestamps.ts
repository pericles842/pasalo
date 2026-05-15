// middlewares/timestamps.ts
import { Request, Response, NextFunction } from "express";

// Middleware para agregar timestamps
export function addTimestamps(req: Request, res: Response, next: NextFunction) {
  const ahoraUTC = new Date().toISOString();

  // si la petición es GET, no se agrega la fecha
  if (req.method === "GET") return next();
  // si created_at no viene en la petición, se agrega la fecha actual
  if (!req.body.hasOwnProperty("created_at") || req.body.created_at === undefined || req.body.created_at === null || req.body.created_at === "") {
    req.body.created_at = ahoraUTC;
  }

  req.body.updated_at = ahoraUTC;

  next();
}
