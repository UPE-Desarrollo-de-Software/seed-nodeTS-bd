/**
 * middleware/authenticate.ts
 * ---------------------------------------------------------------------
 * Middleware de autenticación: lo usan las rutas protegidas (ver
 * `route/persona.routes.ts` y las de `/auth/logout` y `/auth/me` en
 * `route/auth.routes.ts`). Lee el header `Authorization: Bearer <token>`,
 * verifica la firma del access token con `service/token.service.ts` y, si
 * es válido, completa `req.user` con `{ id, email, rol }` — de ahí en
 * adelante, cualquier controller/middleware más abajo en la cadena puede
 * leer `req.user` con la certeza de que ya está autenticado.
 *
 * Si falta el header, no tiene el prefijo `Bearer `, o el token es
 * inválido/venció, corta la cadena con un `UnauthorizedException` (401) en
 * vez de dejar pasar el request. No confundir con `authorize.ts`: acá solo
 * se resuelve "quién sos", no "qué podés hacer".
 */
import type { NextFunction, Request, Response } from 'express';
import { tokenService } from '../service/token.service.js';
import { UnauthorizedException } from '../exception/unauthorized.exception.js';

const BEARER_PREFIX = 'Bearer ';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization');

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedException('Falta el header Authorization: Bearer.', 'TOKEN_FALTANTE'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);

  try {
    const payload = await tokenService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
    next();
  } catch (err) {
    next(err);
  }
}
