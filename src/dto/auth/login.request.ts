/**
 * dto/auth/login.request.ts
 * Body de `POST /auth/login`. A propósito NO valida el largo mínimo real
 * del password (8 caracteres, como en register.request.ts) — acá solo
 * pide que no esté vacío, porque el mensaje de error de credenciales
 * inválidas ya lo da `service/auth.service.ts` de forma genérica; no
 * queremos que la validación del DTO le confirme a un atacante "tu
 * password es demasiado corto" antes incluso de intentar loguearse.
 */
import { z } from 'zod';

export const loginRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  })
  .meta({ id: 'LoginRequest' });

export type LoginRequest = z.infer<typeof loginRequestSchema>;
