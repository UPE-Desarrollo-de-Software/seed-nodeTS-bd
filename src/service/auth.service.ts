/**
 * service/auth.service.ts
 * ---------------------------------------------------------------------
 * Lógica de negocio de autenticación. Como todo `service/`, no importa
 * `express` ni conoce `req`/`res` — recibe tipos de `dto/` o primitivos,
 * devuelve entidades de dominio o lanza excepciones de `exception/`. Lo
 * consume `controller/auth.controller.ts`.
 *
 * `register`: valida que el email no exista (si existe, 409) y hashea el
 * password con argon2id antes de guardarlo — nunca se guarda ni se loguea
 * el password en texto plano.
 *
 * `issueTokenPair` (privada, no se exporta): el paso común a login y
 * refresh — firma un access token nuevo y genera+persiste un refresh
 * token nuevo. Se factoriza acá porque login y refresh terminan haciendo
 * exactamente lo mismo una vez que ya saben qué usuario es.
 *
 * `refresh` es la parte más delicada del archivo — implementa la rotación
 * con detección de reuso:
 *   1. Si el refresh token no existe en la base -> 401.
 *   2. Si YA fue revocado (`revokedAt` seteado) y alguien lo manda de
 *      nuevo, es la señal de que ese token se filtró (alguien más lo tiene
 *      y lo usó, o se está reintentando un token viejo) -> se revocan
 *      TODOS los refresh tokens del usuario (`revokeAllForUser`) y se
 *      responde 401. Es la mitigación estándar contra robo de refresh
 *      tokens.
 *   3. Si venció -> 401.
 *   4. Si es válido -> se revoca este token puntual (nunca se reutiliza
 *      el mismo) y se emite un par nuevo.
 *
 * `logout` revoca el refresh token recibido (si existe y no estaba ya
 * revocado) — no lanza error si ya estaba revocado o no existe, para que
 * hacer logout dos veces sea inofensivo.
 */
import argon2 from 'argon2';
import { userRepository } from '../repository/user.repository.js';
import { refreshTokenRepository } from '../repository/refresh-token.repository.js';
import { tokenService } from './token.service.js';
import { ConflictException } from '../exception/conflict.exception.js';
import { UnauthorizedException } from '../exception/unauthorized.exception.js';
import { NotFoundException } from '../exception/not-found.exception.js';
import type { RegisterRequest } from '../dto/auth/register.request.js';
import type { LoginRequest } from '../dto/auth/login.request.js';
import type { User } from '../model/user.model.js';
import type { TokenPair } from '../model/refresh-token.model.js';

async function register(input: RegisterRequest): Promise<User> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictException(
      `Ya existe un usuario con el email ${input.email}`,
      'USUARIO_EMAIL_DUPLICADO',
    );
  }
  const passwordHash = await argon2.hash(input.password);
  return userRepository.create({ email: input.email, passwordHash });
}

async function issueTokenPair(user: User): Promise<TokenPair> {
  const accessToken = await tokenService.signAccessToken({
    sub: user.id,
    email: user.email,
    rol: user.rol,
  });
  const { token: refreshToken, tokenHash, expiresAt } = tokenService.generateRefreshToken();
  await refreshTokenRepository.create({ tokenHash, userId: user.id, expiresAt });
  return { accessToken, refreshToken };
}

async function login(input: LoginRequest): Promise<{ user: User; tokens: TokenPair }> {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedException('Credenciales inválidas.', 'CREDENCIALES_INVALIDAS');
  }
  const passwordOk = await argon2.verify(user.passwordHash, input.password);
  if (!passwordOk) {
    throw new UnauthorizedException('Credenciales inválidas.', 'CREDENCIALES_INVALIDAS');
  }
  const tokens = await issueTokenPair(user);
  return { user, tokens };
}

async function refresh(refreshTokenPlain: string): Promise<TokenPair> {
  const tokenHash = tokenService.hashRefreshToken(refreshTokenPlain);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!stored) {
    throw new UnauthorizedException('Refresh token inválido.', 'REFRESH_TOKEN_INVALIDO');
  }

  if (stored.revokedAt) {
    // Reuso de un token ya revocado: se asume compromiso de la sesión y se
    // revocan todos los refresh tokens del usuario.
    await refreshTokenRepository.revokeAllForUser(stored.userId);
    throw new UnauthorizedException(
      'Refresh token reutilizado. Se revocó la sesión.',
      'REFRESH_TOKEN_REUTILIZADO',
    );
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedException('Refresh token vencido.', 'REFRESH_TOKEN_VENCIDO');
  }

  const user = await userRepository.findById(stored.userId);
  if (!user) {
    throw new UnauthorizedException('Usuario inexistente.', 'REFRESH_TOKEN_INVALIDO');
  }

  await refreshTokenRepository.revoke(stored.id);
  return issueTokenPair(user);
}

async function logout(refreshTokenPlain: string): Promise<void> {
  const tokenHash = tokenService.hashRefreshToken(refreshTokenPlain);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);
  if (stored && !stored.revokedAt) {
    await refreshTokenRepository.revoke(stored.id);
  }
}

async function me(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundException('Usuario no encontrado.', 'USUARIO_NO_ENCONTRADO');
  }
  return user;
}

export const authService = {
  register,
  login,
  refresh,
  logout,
  me,
};
