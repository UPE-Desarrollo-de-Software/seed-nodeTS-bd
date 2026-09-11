/**
 * dto/persona/create-persona.request.ts
 * ---------------------------------------------------------------------
 * Body de `POST /personas`. Este es EL archivo de referencia que cita el
 * spec original de la semilla para el patrón de DTO: un solo archivo con
 * el schema de zod + el tipo inferido + el `.meta({id})` para OpenAPI —
 * nunca una `interface` separada del validador.
 *
 * Este mismo schema (o una variante `.partial()` de él) se reusa para PUT
 * y PATCH — ver `dto/persona/update-persona.request.ts` — así los tres
 * endpoints de escritura de Persona comparten exactamente las mismas
 * reglas de validación por campo, declaradas una sola vez acá.
 *
 * `dni` valida formato (7 u 8 dígitos) pero NO unicidad — la unicidad la
 * chequea `service/persona.service.ts` (`assertDniDisponible`) contra la
 * base, porque eso requiere una consulta, no es algo que un schema de zod
 * pueda validar por sí solo.
 */
import { z } from 'zod';

export const createPersonaRequestSchema = z
  .object({
    nombre: z.string().min(2).max(100),
    apellido: z.string().min(2).max(100),
    dni: z.string().regex(/^\d{7,8}$/, 'DNI inválido'),
    email: z.email().optional(),
    telefono: z.string().max(30).optional(),
    fechaNacimiento: z.coerce.date(),
  })
  .meta({ id: 'CreatePersonaRequest' });

export type CreatePersonaRequest = z.infer<typeof createPersonaRequestSchema>;
