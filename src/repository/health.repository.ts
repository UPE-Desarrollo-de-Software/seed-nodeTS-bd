/**
 * repository/health.repository.ts
 * ---------------------------------------------------------------------
 * El más chico de los repositories: solo existe para que
 * `controller/health.controller.ts` pueda chequear "¿la base responde?"
 * en `GET /health/ready` sin romper la regla de capas (ningún controller
 * importa `db/client.ts` directo — ver README, sección de arquitectura).
 * `SELECT 1` es la forma estándar de verificar conectividad sin depender
 * de que exista ninguna tabla en particular.
 */
import { prisma } from '../db/client.js';

async function ping(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export const healthRepository = {
  ping,
};
