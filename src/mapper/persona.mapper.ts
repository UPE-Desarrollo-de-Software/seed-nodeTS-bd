/**
 * mapper/persona.mapper.ts
 * ---------------------------------------------------------------------
 * Traduce la entidad `Persona` (tal como sale de Prisma, con objetos
 * `Date`) al DTO de respuesta `PersonaResponse` (con fechas como string
 * ISO, que es lo que espera el schema de `dto/persona/persona.response.ts`
 * y lo que se puede serializar a JSON sin sorpresas). Persona no tiene
 * campos sensibles que filtrar, pero el patrón es el mismo que
 * `mapper/user.mapper.ts`: el controller nunca devuelve la entidad de
 * Prisma tal cual, siempre pasa por acá primero.
 */
import type { Persona } from '../model/persona.model.js';
import type { PersonaResponse } from '../dto/persona/persona.response.js';

export function toPersonaResponse(persona: Persona): PersonaResponse {
  return {
    id: persona.id,
    nombre: persona.nombre,
    apellido: persona.apellido,
    dni: persona.dni,
    email: persona.email,
    telefono: persona.telefono,
    fechaNacimiento: persona.fechaNacimiento.toISOString().slice(0, 10),
    activo: persona.activo,
    createdAt: persona.createdAt.toISOString(),
    updatedAt: persona.updatedAt.toISOString(),
  };
}
