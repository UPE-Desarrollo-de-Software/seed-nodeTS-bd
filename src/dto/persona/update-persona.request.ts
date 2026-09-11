/**
 * dto/persona/update-persona.request.ts
 * ---------------------------------------------------------------------
 * Bodies de `PUT /personas/:id` y `PATCH /personas/:id`. En vez de
 * redeclarar los 6 campos de Persona de nuevo, ambos se derivan de
 * `createPersonaRequestSchema` (ver create-persona.request.ts) con los
 * métodos que trae zod para transformar un schema existente:
 *
 *   - `updatePersonaRequestSchema` (PUT): el mismo schema tal cual, solo
 *     le cambia el `id` de metadata para que aparezca distinto en
 *     OpenAPI. PUT es actualización TOTAL: hay que mandar los 6 campos.
 *   - `patchPersonaRequestSchema` (PATCH): `.partial()` vuelve opcional
 *     cada campo del schema base. PATCH es actualización PARCIAL: se
 *     puede mandar solo el/los campo(s) que se quieren cambiar (ver
 *     `service/persona.service.ts#patch`, que solo actualiza lo que vino
 *     en el body).
 *
 * Este es el patrón a copiar si un módulo nuevo también necesita PUT y
 * PATCH: un schema base para crear, y derivar los otros dos a partir de
 * él en vez de repetir las reglas de validación tres veces.
 */
import { z } from 'zod';
import { createPersonaRequestSchema } from './create-persona.request.js';

export const updatePersonaRequestSchema = createPersonaRequestSchema.meta({
  id: 'UpdatePersonaRequest',
});

export type UpdatePersonaRequest = z.infer<typeof updatePersonaRequestSchema>;

export const patchPersonaRequestSchema = createPersonaRequestSchema.partial().meta({
  id: 'PatchPersonaRequest',
});

export type PatchPersonaRequest = z.infer<typeof patchPersonaRequestSchema>;
