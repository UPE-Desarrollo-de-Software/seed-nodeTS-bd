/**
 * client/http-client.ts
 * ---------------------------------------------------------------------
 * `client/` es la capa para consumir APIs de terceros — no confundir con
 * `dto/` (los DTOs de ESTA API) ni con `repository/` (acceso a NUESTRA
 * base). Este archivo es la fábrica genérica de cliente HTTP (timeout +
 * reintentos + logging) que envuelve cualquier cliente concreto — ver
 * `renaper.client.ts` para un ejemplo de cómo se usa. No tiene nada de
 * Persona/Auth: es infraestructura reutilizable para el próximo servicio
 * externo que haga falta integrar.
 *
 * `timeoutMs`/`retries` tienen defaults sensatos pero cada cliente
 * concreto los puede pisar según lo lento/confiable que sea el proveedor
 * que consuma. Los reintentos son sin backoff exponencial (a propósito,
 * para mantener el ejemplo simple) — para un caso real de alto volumen
 * convendría sumarlo.
 */
import { logger } from '../config/logger.js';

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export function createHttpClient({ baseUrl, timeoutMs = 5000, retries = 2 }: HttpClientOptions) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(path, baseUrl);
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: { 'content-type': 'application/json', ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} al llamar a ${url.toString()}`);
        }

        return (await response.json()) as T;
      } catch (err) {
        lastError = err;
        logger.warn(
          { err, url: url.toString(), attempt },
          'Falló la llamada a un cliente externo, reintentando si corresponde',
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  return { request };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
