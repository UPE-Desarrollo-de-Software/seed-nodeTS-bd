/**
 * controller/health.controller.ts
 * ---------------------------------------------------------------------
 * Handlers de infraestructura para `route/health.routes.ts`. Es el único
 * controller del proyecto que se salta un paso de la cadena habitual
 * (route -> controller -> service -> repository) e importa un repository
 * directo (`health.repository.ts`) en vez de pasar por un service: para
 * un chequeo de una sola línea (`SELECT 1`) meter una capa de service
 * intermedia no aportaba nada, así que se decidió esta única excepción a
 * propósito.
 *
 * `ready` es el único de los dos que atrapa el error él mismo (en vez de
 * dejarlo propagar a `middleware/error-handler.ts`): devolver 503 con
 * `{ status: 'DOWN' }` es una respuesta "exitosa" desde el punto de vista
 * del health-check (le está contestando bien a quien pregunta), no un
 * error interno de la API.
 */
import type { Request, Response } from 'express';
import { healthRepository } from '../repository/health.repository.js';
import { logger } from '../config/logger.js';

function live(_req: Request, res: Response): void {
  res.status(200).json({ status: 'UP' });
}

async function ready(req: Request, res: Response): Promise<void> {
  try {
    await healthRepository.ping();
    res.status(200).json({ status: 'UP' });
  } catch (err) {
    logger.error({ err, requestId: req.requestId }, 'Health check falló: la base no responde');
    res.status(503).json({ status: 'DOWN' });
  }
}

export const healthController = {
  live,
  ready,
};
