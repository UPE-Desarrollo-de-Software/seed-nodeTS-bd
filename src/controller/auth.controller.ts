/**
 * controller/auth.controller.ts
 * ---------------------------------------------------------------------
 * Traduce HTTP <-> dominio para todo lo de autenticación. Como todo
 * `controller/`, es deliberadamente "tonto": lee de `req` (ya validado
 * por `middleware/validate.ts`, ver `route/auth.routes.ts`), llama al
 * método correspondiente de `service/auth.service.ts`, y arma la
 * respuesta con `mapper/user.mapper.ts` (nunca devuelve la entidad `User`
 * de Prisma tal cual — eso filtraría `passwordHash`). Sin lógica de
 * negocio ni acceso a Prisma acá.
 *
 * No hay try/catch en ningún método: si `authService.*` tira una
 * excepción, Express 5 la propaga sola hasta
 * `middleware/error-handler.ts` (ver ese archivo para el detalle).
 *
 * `req.user!` en `me`: el `!` es seguro acá porque esta ruta pasa por
 * `middleware/authenticate.ts` antes (ver route/auth.routes.ts), que es
 * quien garantiza que `req.user` esté completo.
 */
import type { Request, Response } from 'express';
import { authService } from '../service/auth.service.js';
import { toAuthUser } from '../mapper/user.mapper.js';
import type { RegisterRequest } from '../dto/auth/register.request.js';
import type { LoginRequest } from '../dto/auth/login.request.js';
import type { RefreshRequest } from '../dto/auth/refresh.request.js';

async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterRequest;
  const user = await authService.register(body);
  res.status(201).json(toAuthUser(user));
}

async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginRequest;
  const { user, tokens } = await authService.login(body);
  res.status(200).json({ ...tokens, user: toAuthUser(user) });
}

async function refresh(req: Request, res: Response): Promise<void> {
  const body = req.body as RefreshRequest;
  const tokens = await authService.refresh(body.refreshToken);
  res.status(200).json(tokens);
}

async function logout(req: Request, res: Response): Promise<void> {
  const body = req.body as RefreshRequest;
  await authService.logout(body.refreshToken);
  res.status(204).send();
}

async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.me(req.user!.id);
  res.status(200).json(toAuthUser(user));
}

export const authController = {
  register,
  login,
  refresh,
  logout,
  me,
};
