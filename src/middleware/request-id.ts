/**
 * middleware/request-id.ts
 * ---------------------------------------------------------------------
 * Primer middleware que corre en app.ts, antes que nada más. Le pone un
 * `requestId` a cada request (reusando el header `x-request-id` si el
 * caller ya mandó uno — típico cuando hay un proxy/gateway adelante que
 * arma un id de correlación, o para que un cliente pueda repetir el mismo
 * id en reintentos) y lo devuelve también en la respuesta.
 *
 * Ese `req.requestId` es lo que:
 *   - `pino-http` cuelga de cada línea de log (ver app.ts).
 *   - `middleware/error-handler.ts` incluye en el `requestId` del body de
 *     error (ver el formato único de respuesta de error en el README) —
 *     así, dado un error que reporta un usuario, se puede buscar ese id
 *     exacto en los logs para ver qué pasó.
 *
 * El tipo de `req.requestId` está declarado en `types/express.d.ts`.
 */
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  req.requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, req.requestId);
  next();
}
