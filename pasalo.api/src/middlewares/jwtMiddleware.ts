import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/auth';

/** Contenido del token de sesión */
export interface SessionPayload {
  user: {
    uuid: string;
    first_name: string;
    middle_name: string | null;
    email: string;
    photo_url: string | null;
    role_id: number;
  };
  role: string | null;
  company: {
    uuid: string;
    name: string;
    tenant_id: string;
  };
  iat: number;
  exp: number;
}

/**
 * Valida el token de sesión y lo deja disponible en req.session.
 * La permisología por módulo se resuelve aparte.
 */
export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];

  if (!header) {
    res.status(401).json({ message: 'No autorizado', error: 'Token requerido.' });
    return;
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    (req as any).session = verifyToken<SessionPayload>(token);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Sesión expirada', error: 'Tu sesión no es válida, vuelve a iniciar sesión.' });
  }
}
