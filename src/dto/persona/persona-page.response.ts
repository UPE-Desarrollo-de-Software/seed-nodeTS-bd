/**
 * dto/persona/persona-page.response.ts
 * ---------------------------------------------------------------------
 * Respuesta de `GET /personas`: envuelve un array de
 * `personaResponseSchema` (persona.response.ts) en el sobre de paginación
 * estándar de la API (`content`/`page`/`size`/`totalElements`/
 * `totalPages`/`first`/`last`) — el mismo shape que arma
 * `util/pagination.util.ts#buildPage` para cualquier listado paginado, acá
 * declarado como schema de zod para poder documentarlo en OpenAPI.
 */
import { z } from 'zod';
import { personaResponseSchema } from './persona.response.js';

export const personaPageResponseSchema = z
  .object({
    content: z.array(personaResponseSchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
  })
  .meta({ id: 'PersonaPageResponse' });

export type PersonaPageResponse = z.infer<typeof personaPageResponseSchema>;
