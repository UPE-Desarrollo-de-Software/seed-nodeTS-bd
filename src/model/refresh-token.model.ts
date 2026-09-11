/**
 * model/refresh-token.model.ts
 * ---------------------------------------------------------------------
 * `RefreshToken` es el tipo generado por Prisma para `model RefreshToken`
 * (guarda `tokenHash`, nunca el token en texto plano — ver
 * `service/token.service.ts` para el hasheo con SHA-256).
 *
 * `TokenPair` es el par access+refresh que se devuelve al loguearse o al
 * refrescar sesión (`POST /auth/login` y `POST /auth/refresh`); no tiene
 * tabla propia, es puramente la forma de la respuesta.
 */
import type { RefreshToken } from '../db/generated/client.js';

export type { RefreshToken };

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
