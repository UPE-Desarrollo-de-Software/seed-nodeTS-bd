/**
 * config/security.ts
 * ---------------------------------------------------------------------
 * Junta la configuración "de seguridad transversal" que arma `app.ts` a
 * partir de `env`, para no tener valores de Helmet/CORS/JWT sueltos por el
 * código. Tres bloques:
 *
 *   - helmetOptions: opciones para el middleware `helmet()` (cabeceras de
 *     seguridad HTTP). Acá solo prendemos/apagamos la Content-Security-
 *     Policy según el entorno; helmet ya trae buenos defaults para el
 *     resto.
 *   - corsOptions: de dónde se acepta CORS. `CORS_ORIGIN` admite varios
 *     orígenes separados por coma (útil si hay más de un front).
 *   - jwtConfig: el secreto y los TTL que usa `service/token.service.ts`
 *     para firmar/verificar el access token y calcular el vencimiento del
 *     refresh token.
 */
import type { HelmetOptions } from 'helmet';
import type { CorsOptions } from 'cors';
import { env } from './env.js';

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: env.NODE_ENV === 'production',
};

export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
};

export const jwtConfig = {
  secret: env.JWT_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
};
