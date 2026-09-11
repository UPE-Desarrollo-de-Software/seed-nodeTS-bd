/**
 * model/persona.model.ts
 * ---------------------------------------------------------------------
 * Tipos de dominio de Persona. `Persona` es simplemente el tipo que
 * Prisma generó a partir del `model Persona` de schema.prisma —lo
 * reexportamos desde acá (en vez de que cada archivo importe directo de
 * `db/generated/client.js`) para que `service/`, `repository/` y
 * `mapper/` tengan un solo lugar de donde tomar "el tipo Persona".
 *
 * `PersonaFiltros` en cambio NO existe en la base: es un tipo que solo
 * vive en la aplicación, para representar los filtros + paginado que
 * llegan por query string a `GET /personas` (ver
 * `dto/common/page.request.ts` para el schema de validación de esos
 * mismos campos, y `service/persona.service.ts` para cómo se usan).
 */
import type { Persona } from '../db/generated/client.js';

export type { Persona };

export interface PersonaFiltros {
  page: number;
  size: number;
  sort?: string;
  q?: string;
  activo?: boolean;
}
