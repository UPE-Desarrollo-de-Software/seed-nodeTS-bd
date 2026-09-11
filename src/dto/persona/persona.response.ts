/**
 * dto/persona/persona.response.ts
 * ---------------------------------------------------------------------
 * Forma pública de una Persona — lo que arma
 * `mapper/persona.mapper.ts#toPersonaResponse` a partir de la entidad de
 * Prisma. Notar que `fechaNacimiento`/`createdAt`/`updatedAt` se declaran
 * como string (`z.iso.date()` / `z.iso.datetime()`), no como `Date`: en
 * el objeto de Prisma son `Date`, pero lo que efectivamente viaja por
 * HTTP (JSON no tiene tipo fecha) es un string ISO, así que el DTO de
 * respuesta documenta la forma real que ve el cliente, no la forma que
 * tiene en memoria del lado del servidor.
 */
import { z } from 'zod';

export const personaResponseSchema = z
  .object({
    id: z.uuid(),
    nombre: z.string(),
    apellido: z.string(),
    dni: z.string(),
    email: z.email().nullable(),
    telefono: z.string().nullable(),
    fechaNacimiento: z.iso.date(),
    activo: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'PersonaResponse' });

export type PersonaResponse = z.infer<typeof personaResponseSchema>;
