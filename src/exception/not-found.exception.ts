/**
 * exception/not-found.exception.ts
 * Recurso que no existe -> HTTP 404. `code` es libre por si el caller
 * quiere uno más específico que el default (p.ej. `PERSONA_NO_ENCONTRADA`
 * en `service/persona.service.ts`); si no se pasa nada, queda el genérico
 * `RECURSO_NO_ENCONTRADO` (el mismo que usa error-handler.ts para el P2025
 * de Prisma).
 */
import { AppException } from './app.exception.js';

export class NotFoundException extends AppException {
  constructor(message: string, code = 'RECURSO_NO_ENCONTRADO') {
    super(message, 404, code);
  }
}
