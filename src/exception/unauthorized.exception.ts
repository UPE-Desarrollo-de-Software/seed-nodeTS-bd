/**
 * exception/unauthorized.exception.ts
 * Dos excepciones de autenticación/autorización que viven juntas en el
 * mismo archivo porque casi siempre se usan una al lado de la otra:
 *
 *   - UnauthorizedException -> HTTP 401. "No sabemos quién sos" (falta el
 *     header, el token es inválido/venció, el refresh token fue
 *     revocado/reusado...). La lanza `middleware/authenticate.ts` y
 *     `service/auth.service.ts` (login, refresh).
 *   - ForbiddenException -> HTTP 403. "Sabemos quién sos, pero no te
 *     alcanza el rol". La lanza `middleware/authorize.ts` cuando el
 *     `req.user.rol` no está en la lista de roles permitidos de la ruta
 *     (hoy, solo `DELETE /personas/:id` exige ADMIN).
 */
import { AppException } from './app.exception.js';

export class UnauthorizedException extends AppException {
  constructor(message: string, code = 'NO_AUTORIZADO') {
    super(message, 401, code);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string, code = 'ACCESO_PROHIBIDO') {
    super(message, 403, code);
  }
}
