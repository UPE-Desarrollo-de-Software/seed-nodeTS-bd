/**
 * exception/app.exception.ts
 * ---------------------------------------------------------------------
 * Excepción base de negocio. Toda excepción propia de la API (carpeta
 * `exception/`) extiende esta clase para que `middleware/error-handler.ts`
 * pueda mapearlas todas de la misma forma sin conocer cada subtipo: le
 * alcanza con hacer `if (err instanceof AppException)` y leer `statusCode`,
 * `code` y `message` para armar la respuesta con el formato único de error
 * (ver sección "Formato de respuesta de error" del README).
 *
 * `details` es el lugar donde una excepción puede adjuntar una lista de
 * `{ field, message }` — hoy solo lo llena `ZodError` (los errores de
 * validación), pero cualquier excepción propia podría usarlo si alguna vez
 * necesita señalar varios campos a la vez.
 *
 * Quién lanza qué: los `service/*.ts` son los que deciden cuándo lanzar una
 * excepción de negocio (nunca los controllers ni los repositories) — así la
 * regla "qué es un 404 vs. un 409 acá" queda centralizada en la lógica de
 * negocio.
 */
export class AppException extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details: Array<{ field: string; message: string }> = [],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
