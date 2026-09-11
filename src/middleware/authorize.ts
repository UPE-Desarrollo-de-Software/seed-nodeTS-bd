/**
 * middleware/authorize.ts
 * ---------------------------------------------------------------------
 * Factory de middleware para autorización por rol: `authorize('ADMIN')`
 * devuelve un middleware que exige que `req.user.rol` sea `'ADMIN'` (y
 * `authorize('ADMIN', 'USER')` aceptaría cualquiera de los dos). Hoy el
 * único lugar que lo usa es `DELETE /personas/:id` en
 * `route/persona.routes.ts`.
 *
 * Va siempre DESPUÉS de `authenticate.ts` en la cadena de middlewares de la
 * ruta (necesita que `req.user` ya esté completo) — si `req.user` no
 * existe todavía, es un bug de orden en la ruta, y este middleware lo
 * señala con un 401 en vez de explotar con un error raro. Si `req.user`
 * existe pero el rol no está en la lista permitida, corta con un 403
 * (`ForbiddenException`).
 */
import type { NextFunction, Request, Response } from 'express';
import type { Rol } from '../model/enums/rol.enum.js';
import { ForbiddenException, UnauthorizedException } from '../exception/unauthorized.exception.js';

export function authorize(...allowedRoles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedException('No autenticado.', 'NO_AUTENTICADO'));
      return;
    }
    if (!allowedRoles.includes(req.user.rol)) {
      next(new ForbiddenException('No tiene permisos para esta operación.', 'ROL_NO_AUTORIZADO'));
      return;
    }
    next();
  };
}
