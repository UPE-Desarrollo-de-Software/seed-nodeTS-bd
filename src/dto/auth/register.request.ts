/**
 * dto/auth/register.request.ts
 * ---------------------------------------------------------------------
 * Body de `POST /auth/register`. Como todo DTO de esta carpeta, en un
 * solo archivo viven juntos: el schema de zod (que valida el request en
 * `middleware/validate.ts`), el tipo TS inferido (`z.infer`, que usan
 * `controller/`+`service/` para tipar el `body`) y el `.meta({ id })` que
 * lo registra en el documento OpenAPI (`config/openapi.ts`). A propósito
 * NUNCA se declara una `interface RegisterRequest` a mano por separado:
 * si se agrega un campo acá, el tipo y la doc de Swagger se actualizan
 * solos.
 *
 * El máximo de 72 en el password no es arbitrario: es el límite real de
 * argon2/bcrypt (bytes que efectivamente entran en el hash) — mandar algo
 * más largo no lo hace "más seguro", solo trunca silenciosamente en
 * algunas implementaciones. `argon2.hash` se llama en
 * `service/auth.service.ts`.
 */
import { z } from 'zod';

export const registerRequestSchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede superar los 72 caracteres'),
  })
  .meta({ id: 'RegisterRequest' });

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
