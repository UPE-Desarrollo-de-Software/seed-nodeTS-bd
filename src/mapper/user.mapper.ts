/**
 * mapper/user.mapper.ts
 * ---------------------------------------------------------------------
 * Traduce la entidad `User` (que incluye `passwordHash`) al DTO público
 * `AuthUser` (`id`, `email`, `rol`). Este mapper es EL lugar que garantiza
 * que `passwordHash` nunca sale en una respuesta HTTP: lo usan
 * `controller/auth.controller.ts` en register/login/me. Si algún día se
 * agrega un campo sensible nuevo a `User`, alcanza con no tocar este
 * mapper para que siga sin filtrarse.
 */
import type { User } from '../model/user.model.js';
import type { AuthUser } from '../dto/auth/login.response.js';

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
  };
}
