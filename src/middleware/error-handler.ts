/**
 * middleware/error-handler.ts
 * ---------------------------------------------------------------------
 * Último middleware que registra app.ts (con 4 parámetros — así Express
 * sabe que es un error handler, no uno normal). Es el ÚNICO lugar de todo
 * el código que arma el body de una respuesta de error: en ningún
 * controller ni service hay un `res.status(...).json({...})` para un
 * error, siempre se lanza una excepción y se deja que llegue acá.
 *
 * Express 5 propaga solo los errores de handlers async (tanto los `throw`
 * como los reject de una Promise), así que un controller puede tirar una
 * excepción con total tranquilidad sin envolver nada en try/catch — por
 * eso tampoco hace falta el paquete `express-async-errors` que sí se
 * necesitaba en Express 4.
 *
 * Mapeo de errores a status code (ver tabla completa en el README):
 *   - `AppException` (y sus subclases de `exception/`) -> el `statusCode`
 *     y `code` que trae la excepción.
 *   - `ZodError` -> 400 `VALIDATION_ERROR`, con el detalle de qué campo
 *     falló en `details` (ver middleware/validate.ts, que es quien
 *     produce este error cuando el body/query no cumple el schema).
 *   - Prisma `PrismaClientKnownRequestError` con code `P2002` (constraint
 *     UNIQUE violada) -> 409, o `P2025` (registro no encontrado) -> 404.
 *     Esto es una red de seguridad: lo ideal es que cada `service/*.ts`
 *     ya haya chequeado el duplicado/la existencia antes de llegar a
 *     Prisma y haya lanzado su propia `ConflictException`/
 *     `NotFoundException` con un mensaje más claro.
 *   - Cualquier otro `Error` -> 500 `INTERNAL_ERROR` con un mensaje
 *     genérico. El stack trace se loguea (con el `requestId` para poder
 *     correlacionarlo) pero NUNCA se manda al cliente.
 */
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../db/generated/client.js';
import { AppException } from '../exception/app.exception.js';
import { logger } from '../config/logger.js';

interface ErrorDetail {
  field: string;
  message: string;
}

interface ErrorResponseBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  requestId: string;
  details: ErrorDetail[];
}

function buildBody(
  req: Request,
  status: number,
  code: string,
  message: string,
  details: ErrorDetail[] = [],
): ErrorResponseBody {
  return {
    timestamp: new Date().toISOString(),
    status,
    code,
    message,
    path: req.originalUrl,
    requestId: req.requestId,
    details,
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppException) {
    logger.warn({ err, requestId: req.requestId, code: err.code }, err.message);
    res
      .status(err.statusCode)
      .json(buildBody(req, err.statusCode, err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    logger.warn({ err, requestId: req.requestId }, 'Error de validación');
    res.status(400).json(buildBody(req, 400, 'VALIDATION_ERROR', 'Error de validación', details));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      logger.warn({ err, requestId: req.requestId }, 'Recurso duplicado');
      res
        .status(409)
        .json(buildBody(req, 409, 'RECURSO_DUPLICADO', 'El recurso ya existe.'));
      return;
    }
    if (err.code === 'P2025') {
      logger.warn({ err, requestId: req.requestId }, 'Recurso no encontrado');
      res
        .status(404)
        .json(buildBody(req, 404, 'RECURSO_NO_ENCONTRADO', 'El recurso no existe.'));
      return;
    }
  }

  logger.error({ err, requestId: req.requestId }, 'Error interno no controlado');
  res.status(500).json(buildBody(req, 500, 'INTERNAL_ERROR', 'Ocurrió un error interno.'));
}
