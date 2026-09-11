/**
 * model/user.model.ts
 * ---------------------------------------------------------------------
 * `User` es el tipo generado por Prisma para `model User` (incluye
 * `passwordHash` — por eso nunca se devuelve tal cual en una respuesta
 * HTTP, siempre pasa por `mapper/user.mapper.ts` antes).
 *
 * `JwtPayload` es el tipo del contenido del access token: no viene de la
 * base, es lo que `service/token.service.ts` firma al crear el token y lo
 * que devuelve al verificarlo. `sub` (subject) es el id del usuario — es
 * el nombre de claim estándar de JWT, no un capricho nuestro.
 */
import type { User } from '../db/generated/client.js';
import type { Rol } from './enums/rol.enum.js';

export type { User };

export interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  iat?: number;
  exp?: number;
}
