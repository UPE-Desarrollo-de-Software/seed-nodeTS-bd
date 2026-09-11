/**
 * server.ts
 * ---------------------------------------------------------------------
 * Punto de entrada real del proceso (`pnpm dev` y `pnpm start`/
 * `node dist/server.js` arrancan por acá, ver package.json). A diferencia
 * de `app.ts`, este archivo SÍ conoce el puerto y el ciclo de vida del
 * proceso: llama a `createApp().listen(...)` y maneja el apagado
 * ordenado (graceful shutdown).
 *
 * Por qué importa el shutdown ordenado: cuando Docker (o Kubernetes) para
 * un contenedor, manda `SIGTERM` y espera un rato antes de matarlo a la
 * fuerza con `SIGKILL`. Si no se atiende `SIGTERM`, la conexión a Postgres
 * queda colgada del lado del pool y el proceso corta requests en curso de
 * mala manera. Acá, al recibir la señal: se deja de aceptar conexiones
 * nuevas (`server.close`), se espera a que terminen las que ya estaban en
 * curso, y recién ahí se desconecta Prisma (`prisma.$disconnect()`) y se
 * sale con código 0.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './db/client.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Conexión a la base cerrada. Adiós.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
