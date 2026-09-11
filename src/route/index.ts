/**
 * route/index.ts
 * ---------------------------------------------------------------------
 * Punto de entrada de todas las rutas: junta los routers de cada módulo
 * en uno solo (`apiRouter`) que `app.ts` monta bajo el prefijo `/api/v1`.
 * Al agregar un módulo nuevo (ver README), este es el archivo donde hay
 * que sumar la línea `apiRouter.use('/miModulo', miModuloRoutes)`.
 *
 * `healthRouter` se reexporta acá por conveniencia, pero `app.ts` lo monta
 * aparte, en `/health` (sin el prefijo `/api/v1`) — ver
 * `route/health.routes.ts` para por qué health-check vive fuera del
 * versionado de la API.
 */
import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { personaRoutes } from './persona.routes.js';
import { healthRoutes } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/personas', personaRoutes);

export const healthRouter = healthRoutes;
