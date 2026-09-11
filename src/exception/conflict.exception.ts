/**
 * exception/conflict.exception.ts
 * Conflicto con el estado actual de los datos -> HTTP 409. Se usa para
 * duplicados (email ya registrado, DNI ya existente) — el mismo caso que
 * mapea `error-handler.ts` cuando Prisma tira `P2002` (violación de
 * constraint UNIQUE), pero lanzada a mano *antes* de llegar a la base
 * (ver `service/auth.service.ts` y `service/persona.service.ts`) para
 * poder dar un mensaje más claro que el de Prisma.
 */
import { AppException } from './app.exception.js';

export class ConflictException extends AppException {
  constructor(message: string, code = 'RECURSO_DUPLICADO') {
    super(message, 409, code);
  }
}
