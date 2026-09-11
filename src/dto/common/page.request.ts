/**
 * dto/common/page.request.ts
 * ---------------------------------------------------------------------
 * Query params compartidos por cualquier listado paginado de la API —
 * hoy solo `GET /personas`, pero cualquier módulo nuevo con un listado
 * (ver README) puede reusar este mismo schema. Vive en `dto/common/`
 * (no en `dto/persona/`) justamente porque no es específico de Persona.
 *
 * Todos los campos son opcionales con default, así que un `GET /personas`
 * sin query string es válido y trae la primera página de 20 con el orden
 * default. `z.coerce.number()`/`z.coerce.boolean()` son necesarios porque
 * los query params SIEMPRE llegan como string (`?page=2` es el string
 * `"2"`, no el número `2`) — zod los convierte al tipo real acá mismo, en
 * la validación, así el resto del código ya trabaja con tipos correctos
 * (ver `service/persona.service.ts`, que recibe un `page: number`, no un
 * string).
 */
import { z } from 'zod';

export const pageRequestSchema = z
  .object({
    page: z.coerce.number().int().min(0).default(0),
    size: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    q: z.string().optional(),
    activo: z.coerce.boolean().optional(),
  })
  .meta({ id: 'PageRequest' });

export type PageRequest = z.infer<typeof pageRequestSchema>;
