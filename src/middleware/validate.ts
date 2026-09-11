import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * middleware/validate.ts
 * ---------------------------------------------------------------------
 * Factory de middleware: cada `route/*.routes.ts` llama a
 * `validate(algúnSchemaDeDto)` para insertar un paso de validación antes
 * del controller. Esto es lo que conecta la capa `dto/` (donde viven los
 * schemas de zod) con Express — así el controller nunca recibe un body/
 * query "crudo", siempre uno ya validado, coercionado (`z.coerce.date()`,
 * `z.coerce.number()`, etc.) y con los defaults aplicados.
 *
 * Si la validación falla, no arma ninguna respuesta acá: le pasa el
 * `ZodError` a `next(...)` para que lo termine de manejar
 * `middleware/error-handler.ts` (que lo mapea a 400 `VALIDATION_ERROR`
 * con el detalle de qué campo falló).
 */
type Target = 'body' | 'query' | 'params';
export function validate(schema: ZodType, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }

    if (target === 'query') {
      // Express 5 expone `req.query` como getter puro que re-parsea la
      // querystring cruda en cada acceso: no tiene setter y mutar el objeto
      // devuelto no persiste. El valor ya coercionado/con defaults se deja
      // en `req.validatedQuery` en vez de en `req.query`.
      req.validatedQuery = result.data;
    } else {
      req[target] = result.data as never;
    }

    next();
  };
}
