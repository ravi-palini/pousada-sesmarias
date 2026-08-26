import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Assina um payload JWT com a chave secreta configurada.
 */
export function signToken(payload: object, expiresIn: string = env.JWT_EXPIRES_IN): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verifica e decodifica um token JWT.
 * Lança erro caso o token seja inválido ou tenha expirado.
 */
export function verifyToken<T extends object = any>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}

