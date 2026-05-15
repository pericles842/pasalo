import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserPermissions } from "../app/models/role.model";
import { Usuario } from "../app/models/user.model";

const JWT_SECRET: string = process.env.JWT_SECRET || "";

export async function authMiddleware(
  req: Request,
  res: Response,  
  next: NextFunction
): Promise<void> {
  const token = req.headers["authorization"];
  const module_id = req.headers["module_id"];

  if (!token) throw "Token requerido";
  if (!module_id) throw "Modulo requerido";
  try {
    const payload_jwt = (await jwt.verify(token, JWT_SECRET)) as {
      user: Omit<Usuario, "password">;
      iat: number;
      exp: number;
    };

    const permissions = await UserPermissions.getUserPermission(
      payload_jwt.user.id
    );

    const [module_access] = permissions.filter(
      (p) => p.module_id == parseInt(module_id as string)
    );

    //errores de acceso
    if (req.method === "GET" && !module_access.can_view)
      throw `Acceso denegado en el modulo de ${module_access.module}, no puedes ver este recurso`;
    if (req.method === "POST" && !module_access.can_create)
      throw `Acceso denegado en el modulo de ${module_access.module}, no puedes crear este recurso`;
    if (req.method === "PUT" && !module_access.can_update)
      throw `Acceso denegado en el modulo de ${module_access.module}, no puedes actualizar este recurso`;
    if (req.method === "DELETE" && !module_access.can_delete)
      throw `Acceso denegado en el modulo de ${module_access.module}, no puedes eliminar este recurso`;

    next();
  } catch (err) {
    throw err;
  }
}
