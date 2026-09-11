/**
 * types/express.d.ts
 * ---------------------------------------------------------------------
 * Aumenta (module augmentation) el tipo `Request` de Express con los
 * campos propios que le agrega esta app, para que TypeScript los conozca
 * en cualquier archivo sin necesidad de castear. Este archivo no genera
 * código en runtime — es puro `.d.ts`, solo tipos.
 *
 *   - `requestId`: lo completa `middleware/request-id.ts` en cada request.
 *   - `user`: lo completa `middleware/authenticate.ts` cuando el token es
 *     válido; queda `undefined` en rutas públicas.
 *   - `validatedQuery`: lo completa `middleware/validate.ts` cuando se
 *     valida `req.query` (ver ese archivo para la explicación completa de
 *     por qué no se puede usar `req.query` directo en Express 5).
 *
 * El spec original de la semilla decía "extender el tipo Request en un
 * `.d.ts` bajo `model/` o `src/types/`" — se optó por `src/types/` para
 * separar claramente "tipos de dominio" (`model/`) de "aumentos de tipos
 * de una librería externa" (acá).
 */
import type { Rol } from '../model/enums/rol.enum.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: AuthenticatedUser;
      /**
       * Resultado de `validate(schema, 'query')`. Existe porque `req.query`
       * en Express 5 es un getter sin setter que re-parsea la URL en cada
       * acceso: no hay forma de persistir ahí el valor ya validado.
       */
      validatedQuery?: unknown;
    }
  }
}

export {};
