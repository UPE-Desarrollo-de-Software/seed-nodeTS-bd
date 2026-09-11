/**
 * dto/common/error.response.ts
 * ---------------------------------------------------------------------
 * El único formato de error de toda la API — lo emite exclusivamente
 * `middleware/error-handler.ts` (ver ese archivo para el mapeo completo
 * de excepciones a status code). Vive en `dto/common/` porque no es de
 * ningún módulo en particular: cualquier endpoint, de cualquier módulo,
 * puede fallar y devolver este shape.
 *
 * `details` se llena solo en errores de validación (400), con un
 * `{ field, message }` por cada issue que reportó zod — para cualquier
 * otro tipo de error queda como array vacío.
 *
 * Este schema también documenta las respuestas de error en
 * `config/openapi.ts` (todas los `4xx`/`5xx` de cada endpoint apuntan a
 * `errorResponseSchema`).
 */
import { z } from 'zod';

export const errorDetailSchema = z
  .object({
    field: z.string(),
    message: z.string(),
  })
  .meta({ id: 'ErrorDetail' });

export const errorResponseSchema = z
  .object({
    timestamp: z.iso.datetime(),
    status: z.number().int(),
    code: z.string(),
    message: z.string(),
    path: z.string(),
    requestId: z.string(),
    details: z.array(errorDetailSchema),
  })
  .meta({ id: 'ErrorResponse' });

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
