/**
 * service/token.service.ts
 * ---------------------------------------------------------------------
 * Todo lo criptográfico de la autenticación vive acá — es el único
 * archivo que sabe cómo se firma un JWT o cómo se genera/hashea un
 * refresh token. `service/auth.service.ts` y
 * `middleware/authenticate.ts` lo consumen sin conocer estos detalles.
 *
 *   - Access token: un JWT HS256 (firmado con `JWT_SECRET`) que lleva
 *     `sub` (id de usuario), `email` y `rol` como claims, con el TTL de
 *     `JWT_ACCESS_TTL` (default 15m). Se verifica en cada request
 *     protegido — no pega contra la base, la firma alcanza para confiar
 *     en el contenido.
 *   - Refresh token: NO es un JWT. Es simplemente 32 bytes random en
 *     base64url (`generateRefreshToken`). Se persiste solo su hash SHA-256
 *     (`hashRefreshToken`) en la tabla `refresh_tokens` — si alguien lee
 *     la base, no puede reconstruir el token original a partir del hash.
 *
 * `parseDurationMs` es un parser casero de duraciones tipo "15m"/"7d"
 * (no se trajo una librería para esto): entiende segundos/minutos/horas/
 * días y se usa para calcular `expiresAt` del refresh token.
 */
import { randomBytes, createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { jwtConfig } from '../config/security.js';
import type { JwtPayload } from '../model/user.model.js';
import { UnauthorizedException } from '../exception/unauthorized.exception.js';

const secretKey = new TextEncoder().encode(jwtConfig.secret);

const DURATION_UNITS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/** Convierte "15m", "7d", etc. a milisegundos. */
function parseDurationMs(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Formato de duración inválido: ${value}`);
  }
  const [, amount, unit] = match;
  return Number(amount) * DURATION_UNITS[unit as keyof typeof DURATION_UNITS];
}

async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ email: payload.email, rol: payload.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(jwtConfig.accessTtl)
    .sign(secretKey);
}

async function verifyAccessToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      rol: payload.rol as JwtPayload['rol'],
    };
  } catch {
    throw new UnauthorizedException('Token de acceso inválido o vencido.', 'TOKEN_INVALIDO');
  }
}

function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + parseDurationMs(jwtConfig.refreshTtl));
  return { token, tokenHash, expiresAt };
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const tokenService = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  parseDurationMs,
};
