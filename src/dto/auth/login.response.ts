/**
 * dto/auth/login.response.ts
 * ---------------------------------------------------------------------
 * DTOs de salida de autenticación. Tres schemas relacionados en un mismo
 * archivo porque uno compone al otro:
 *
 *   - `rolEnumSchema`: la versión zod del enum `Rol` de Prisma (ver
 *     model/enums/rol.enum.ts) — se redeclara acá en vez de derivarla del
 *     enum de Prisma porque `zod-openapi` necesita un schema de zod para
 *     poder documentarlo en el OpenAPI, y así queda con su propio
 *     `.meta({ id: 'Rol' })`.
 *   - `authUserSchema`/`AuthUser`: la forma pública de un usuario —lo que
 *     devuelve `mapper/user.mapper.ts` y usan `POST /auth/register`,
 *     `GET /auth/me` y, embebido, `loginResponseSchema`. Nunca incluye
 *     `passwordHash`.
 *   - `loginResponseSchema`/`LoginResponse`: la respuesta completa de
 *     `POST /auth/login` — el par de tokens más el usuario autenticado.
 */
import { z } from 'zod';

export const rolEnumSchema = z.enum(['ADMIN', 'USER']).meta({ id: 'Rol' });

export const authUserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    rol: rolEnumSchema,
  })
  .meta({ id: 'AuthUser' });

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: authUserSchema,
  })
  .meta({ id: 'LoginResponse' });

export type LoginResponse = z.infer<typeof loginResponseSchema>;
