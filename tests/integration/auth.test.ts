/**
 * tests/integration/auth.test.ts
 * ---------------------------------------------------------------------
 * Cobertura de todo el módulo de autenticación: register (happy path +
 * 409 duplicado), login (happy path + 401), refresh (rotación + reuso
 * detectado -> 401), logout y `/me` (401 sin token). Corre con
 * Supertest contra `createApp()` — nunca contra un servidor real
 * escuchando en un puerto, ni contra Prisma mockeado.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Import dinámico: `app.ts` importa `config/env.ts`, que valida `process.env`
// al cargarse. El módulo no debe evaluarse hasta que `tests/setup.ts` haya
// terminado de levantar el contenedor y de setear DATABASE_URL / JWT_SECRET.
let app: Express;

beforeAll(async () => {
  const { createApp } = await import('../../src/app.js');
  app = createApp();
});

describe('POST /api/v1/auth/register', () => {
  it('crea un usuario nuevo', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nuevo@example.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'nuevo@example.com', rol: 'USER' });
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('responde 409 si el email ya existe', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicado@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicado@example.com', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USUARIO_EMAIL_DUPLICADO');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('devuelve access y refresh token con credenciales válidas', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.refreshToken).toBeTypeOf('string');
  });

  it('responde 401 con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'no-existe@example.com', password: 'loquesea' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  async function registerAndLogin(email: string) {
    await request(app).post('/api/v1/auth/register').send({ email, password: 'Password123!' });
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password123!' });
    return res.body as { accessToken: string; refreshToken: string };
  }

  it('rota el refresh token', async () => {
    const tokens = await registerAndLogin('refresh@example.com');

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(tokens.refreshToken);
  });

  it('revoca toda la sesión si el refresh token ya fue usado (reuso)', async () => {
    const tokens = await registerAndLogin('reuso@example.com');

    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: tokens.refreshToken });

    // Reintento del mismo refresh token, ya revocado por la rotación anterior.
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('REFRESH_TOKEN_REUTILIZADO');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('devuelve los datos del usuario autenticado', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'me@example.com', password: 'Password123!' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'me@example.com', password: 'Password123!' });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revoca el refresh token recibido', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'logout@example.com', password: 'Password123!' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'logout@example.com', password: 'Password123!' });

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ refreshToken: login.body.refreshToken });

    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});
