// helpers/auth.ts

/** Duracion por defecto de la sesion */
export const JWT_EXPIRES_IN = '8h';
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userResponse } from "../app/interfaces/user";

/**
 * Encripta la contraseña del usuario
 *
 * @export
 * @param {string} plain
 * @return {*}
 */
export async function hashPassword(plain: string) {
  const saltRounds = 12; // 10-14 es común; 12 es un buen compromiso
  return await bcrypt.hash(plain, saltRounds);
}

/**
 * Compara la contraseña del usuario
 *
 * @export
 * @param {string} pass_plain
 * @param {string} hash
 * @return {boolean}
 */
export async function comparePassword(plain: string, hash: string) {
  return await bcrypt.compare(plain, hash);
}

/**
 * Decodifica el token
 *
 * @export
 * @param {string} token
 * @return {Promise<object>}
 */
export function decodeToken(token: string) {
  return jwt.decode(token) as unknown as {
    exp: string;
    iat: string;
    user: userResponse;
  };
}

/**
 * Firma el token de sesion del usuario
 *
 * @export
 * @param {object} payload
 * @param {string} [expires_in]
 * @return {string}
 */
export function generateToken(payload: object, expires_in: string = JWT_EXPIRES_IN) {
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new Error('JWT_SECRET no esta configurado en el .env');

  return jwt.sign(payload, secret, { expiresIn: expires_in } as jwt.SignOptions);
}

/**
 * Verifica el token de sesion y devuelve su contenido
 *
 * @export
 * @param {string} token
 * @return {object}
 */
export function verifyToken<T>(token: string): T {
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new Error('JWT_SECRET no esta configurado en el .env');

  return jwt.verify(token, secret) as T;
}
