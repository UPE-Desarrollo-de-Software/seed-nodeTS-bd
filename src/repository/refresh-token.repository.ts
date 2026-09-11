/**
 * repository/refresh-token.repository.ts
 * ---------------------------------------------------------------------
 * Fachada sobre `prisma.refreshToken`. Sostiene toda la persistencia de la
 * rotación de refresh tokens que orquesta `service/auth.service.ts`:
 *
 *   - `create`: guarda un refresh token nuevo (ya hasheado — este archivo
 *     nunca ve el token en texto plano, eso lo maneja
 *     `service/token.service.ts`).
 *   - `findByTokenHash`: para validar un refresh token que llega en
 *     `POST /auth/refresh` o `/auth/logout`.
 *   - `revoke`: marca UN token como usado (`revokedAt = now()`) — pasa en
 *     cada rotación exitosa, sobre el token que se acaba de canjear.
 *   - `revokeAllForUser`: apaga TODOS los refresh tokens vigentes de un
 *     usuario de una sola vez — se dispara cuando `auth.service.ts`
 *     detecta que se reusó un token ya revocado (indicio de que alguien
 *     más tiene ese refresh token), como forma de cortar cualquier sesión
 *     robada.
 */
import { prisma } from '../db/client.js';
import type { RefreshToken } from '../db/generated/client.js';

async function create(data: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}): Promise<RefreshToken> {
  return prisma.refreshToken.create({ data });
}

async function findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

async function revoke(id: string): Promise<RefreshToken> {
  return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}

async function revokeAllForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export const refreshTokenRepository = {
  create,
  findByTokenHash,
  revoke,
  revokeAllForUser,
};
