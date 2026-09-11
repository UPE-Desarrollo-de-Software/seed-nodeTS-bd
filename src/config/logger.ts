/**
 * config/logger.ts
 * ---------------------------------------------------------------------
 * Instancia única de pino (logger JSON estructurado) que se importa desde
 * cualquier capa que necesite loguear (middleware/error-handler.ts,
 * controllers, services, etc). `app.ts` además la conecta a `pino-http`
 * para que loguee cada request/response automáticamente con su
 * `requestId` (ver middleware/request-id.ts).
 *
 * `redact` tacha campos sensibles del log aunque vengan anidados en el
 * objeto que se loguea (p.ej. `{ user: { passwordHash: '...' } }`) — así
 * un `logger.info({ user })` accidental nunca termina filtrando un hash de
 * password o un access token a los logs.
 */
import { pino } from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'password', 'passwordHash', 'tokenHash'],
    censor: '[REDACTED]',
  },
});
