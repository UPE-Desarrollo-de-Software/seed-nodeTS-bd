/**
 * dto/auth/refresh.request.ts
 * Body de `POST /auth/refresh` y de `POST /auth/logout` (ambos reciben
 * el mismo shape: `{ refreshToken }`, ver route/auth.routes.ts). El
 * `service/auth.service.ts` es quien hashea este valor y lo compara
 * contra lo persistido en la tabla `refresh_tokens` — acá solo se valida
 * que venga un string no vacío.
 */
import { z } from 'zod';

export const refreshRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'refreshToken es obligatorio'),
  })
  .meta({ id: 'RefreshRequest' });

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
