import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 no atrapa las promesas rechazadas de un handler `async`: la rejection
 * queda sin manejar y Node 22 tumba el proceso. Este wrapper la deriva al
 * middleware de errores de `index.ts`, así un request inválido devuelve 500
 * en vez de matar el server.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
