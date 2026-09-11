/**
 * route/auth.routes.ts
 * ---------------------------------------------------------------------
 * Mapeo path -> handler para todo lo de autenticación, montado bajo
 * `/api/v1/auth` (ver route/index.ts). Cada línea es declarativa: la
 * cadena de middlewares de la ruta (`validate(schema)` para el body,
 * `authenticate` para exigir sesión) y al final el método del controller
 * que la resuelve — sin lógica acá, ni siquiera un `if`.
 *
 *   POST /register  - público, valida con registerRequestSchema
 *   POST /login      - público, valida con loginRequestSchema
 *   POST /refresh     - público (el propio refresh token es la credencial)
 *   POST /logout      - requiere sesión (`authenticate`)
 *   GET  /me           - requiere sesión (`authenticate`)
 */
import { Router } from 'express';
import { authController } from '../controller/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerRequestSchema } from '../dto/auth/register.request.js';
import { loginRequestSchema } from '../dto/auth/login.request.js';
import { refreshRequestSchema } from '../dto/auth/refresh.request.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerRequestSchema), authController.register);
authRoutes.post('/login', validate(loginRequestSchema), authController.login);
authRoutes.post('/refresh', validate(refreshRequestSchema), authController.refresh);
authRoutes.post('/logout', authenticate, validate(refreshRequestSchema), authController.logout);
authRoutes.get('/me', authenticate, authController.me);
