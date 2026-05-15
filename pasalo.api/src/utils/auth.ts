// helpers/auth.ts
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
