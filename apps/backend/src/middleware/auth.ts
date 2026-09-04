import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from 'jose';
import { asyncHandler } from '../utils/asyncHandler';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const ISSUER = `${SUPABASE_URL}/auth/v1`;

// Escotilla para desarrollo local: permite pegarle a la API sin sesión de
// Supabase, haciéndose pasar por un usuario fijo. Nunca en producción, por eso
// además del env var se exige que NODE_ENV no sea 'production'.
const DEV_USER_ID =
  process.env.NODE_ENV !== 'production' ? process.env.DEV_AUTH_USER_ID?.trim() || null : null;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userEmail?: string;
    }
  }
}

// Supabase firma los access tokens con ES256 y publica la clave pública en el
// JWKS del proyecto, así que el backend valida la firma sin compartir secretos.
// `createRemoteJWKSet` cachea las claves y sabe refrescarlas si rotan.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    if (!SUPABASE_URL) {
      throw new Error('Falta la variable SUPABASE_URL: sin eso no se pueden validar los tokens');
    }
    jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));
  }
  return jwks;
}

/** Corta el arranque si el server quedaría sin forma de autenticar a nadie. */
export function assertAuthConfig() {
  if (DEV_USER_ID) {
    console.warn(
      `[auth] ATENCIÓN: modo desarrollo, todos los requests se tratan como el usuario "${DEV_USER_ID}". ` +
        'No levantes el server así fuera de tu máquina.'
    );
    return;
  }
  if (!SUPABASE_URL) {
    throw new Error(
      'Falta la variable SUPABASE_URL. Cargala en el .env (o seteá DEV_AUTH_USER_ID para desarrollo local).'
    );
  }
}

export const requireUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (DEV_USER_ID) {
      req.userId = DEV_USER_ID;
      return next();
    }

    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Falta el token de sesión' });
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Falta el token de sesión' });

    try {
      const { payload } = await jwtVerify(token, getJwks(), {
        issuer: ISSUER,
        audience: 'authenticated',
      });

      if (!payload.sub) {
        return res.status(401).json({ error: 'El token no identifica a ningún usuario' });
      }

      req.userId = payload.sub;
      req.userEmail = typeof payload.email === 'string' ? payload.email : undefined;
      next();
    } catch (err) {
      // 401 y no 500: el token es del cliente, no es un error del server. El
      // mobile distingue este caso para mandar a la pantalla de login.
      if (err instanceof joseErrors.JWTExpired) {
        return res.status(401).json({ error: 'Tu sesión venció, volvé a entrar' });
      }
      if (err instanceof joseErrors.JOSEError) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      throw err; // algo raro (JWKS caído): que lo tome el middleware de errores
    }
  }
);
