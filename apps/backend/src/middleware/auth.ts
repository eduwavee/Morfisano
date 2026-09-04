import type { NextFunction, Request, Response } from 'express';

// TODO: reemplazar por auth real (JWT propio, Supabase Auth o Clerk).
// Por ahora identifica al usuario por el header `x-user-id` para poder
// desarrollar y probar el resto de la API sin bloquear en login.
// Si no viene el header, usa un usuario demo fijo (útil en desarrollo local).
export const DEMO_USER_ID = 'demo-user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  req.userId = (req.header('x-user-id') || DEMO_USER_ID).trim();
  next();
}
