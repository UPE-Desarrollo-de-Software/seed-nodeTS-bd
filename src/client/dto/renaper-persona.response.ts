/**
 * client/dto/renaper-persona.response.ts
 * ---------------------------------------------------------------------
 * DTO de la respuesta del proveedor externo (RENAPER, ver
 * `../renaper.client.ts`), deliberadamente separado del DTO propio
 * (`dto/persona/persona.response.ts`) porque sus nombres de campo y su
 * forma no tienen por qué coincidir con los nuestros — de hecho, notar
 * `numeroDocumento`/`nombres`/`apellidos` en vez de `dni`/`nombre`/
 * `apellido`. Si algún día se integra de verdad, sería
 * `service/persona.service.ts` quien traduzca de esta forma a la nuestra
 * (no `renaper.client.ts`, que solo debe conocer la forma del proveedor).
 *
 * Por eso `client/` tiene su propia sub-carpeta `dto/`, separada de la
 * `dto/` de la raíz de `src/`: son DTOs de un proveedor externo, no
 * contratos propios de esta API.
 */
import { z } from 'zod';

export const renaperPersonaResponseSchema = z.object({
  numeroDocumento: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  fechaNacimiento: z.string(),
  sexo: z.enum(['M', 'F', 'X']).optional(),
});

export type RenaperPersonaResponse = z.infer<typeof renaperPersonaResponseSchema>;
