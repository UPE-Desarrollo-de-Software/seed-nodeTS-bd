/**
 * client/renaper.client.ts
 * ---------------------------------------------------------------------
 * Cliente concreto de EJEMPLO — no está enganchado a ningún endpoint de
 * esta API todavía, existe solo para mostrar el patrón completo de
 * `client/`: envolver `createHttpClient` (http-client.ts) con la URL base
 * del proveedor y devolver datos ya validados/tipados con el DTO propio
 * del proveedor (`dto/renaper-persona.response.ts`), no con `unknown`.
 *
 * "RENAPER" es el Registro Nacional de las Personas de Argentina — un
 * caso de uso real sería: al dar de alta una Persona, en vez de pedirle
 * todos los datos al usuario, buscarlos acá por DNI. Si un service
 * quisiera usarlo, importaría `renaperClient` (nunca `http-client.ts`
 * directo) — la regla de capas dice `service -> client`, nunca al revés
 * ni salteándose este archivo.
 *
 * TODO: reemplazar por la URL real del proveedor cuando esté disponible.
 */
import { createHttpClient } from './http-client.js';
import { renaperPersonaResponseSchema, type RenaperPersonaResponse } from './dto/renaper-persona.response.js';

const RENAPER_BASE_URL = process.env.RENAPER_BASE_URL ?? 'https://renaper.example.gob.ar';

const httpClient = createHttpClient({ baseUrl: RENAPER_BASE_URL, timeoutMs: 5000, retries: 2 });

async function buscarPorDni(dni: string): Promise<RenaperPersonaResponse> {
  const raw = await httpClient.request<unknown>(`/personas/${dni}`);
  return renaperPersonaResponseSchema.parse(raw);
}

export const renaperClient = {
  buscarPorDni,
};
