/**
 * tests/integration/persona.test.ts
 * ---------------------------------------------------------------------
 * Cobertura del ABM de Persona: 401 sin token, alta (happy path), 409 por
 * DNI duplicado, listado paginado, 404 por id inexistente, edición
 * parcial, 403 al borrar con un usuario USER, y soft-delete exitoso con
 * ADMIN. El registro público (`POST /auth/register`) siempre crea rol
 * USER — como no hay endpoint para promover a ADMIN, el usuario admin de
 * este test se promueve escribiendo directo con Prisma (ver `beforeAll`
 * más abajo), algo que en un test de negocio real no haría un cliente de
 * la API pero que acá es la forma más simple de tener un usuario ADMIN
 * para probar `DELETE /personas/:id`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let userToken: string;
let adminToken: string;

async function registerAndLogin(email: string): Promise<string> {
  await request(app).post('/api/v1/auth/register').send({ email, password: 'Password123!' });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password123!' });
  return res.body.accessToken as string;
}

beforeAll(async () => {
  const { createApp } = await import('../../src/app.js');
  const { prisma } = await import('../../src/db/client.js');
  const { Rol } = await import('../../src/db/generated/client.js');

  app = createApp();

  userToken = await registerAndLogin('persona-user@example.com');

  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'persona-admin@example.com', password: 'Password123!' });
  // El registro público siempre crea USER; para el test se promueve a ADMIN
  // directo en la base, ya que no hay endpoint para eso (a propósito).
  await prisma.user.update({
    where: { email: 'persona-admin@example.com' },
    data: { rol: Rol.ADMIN },
  });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'persona-admin@example.com', password: 'Password123!' });
  adminToken = loginRes.body.accessToken;
});

const personaPayload = {
  nombre: 'Juana',
  apellido: 'Pérez',
  dni: '40123456',
  email: 'juana.perez@example.com',
  telefono: '1155667788',
  fechaNacimiento: '1992-07-15',
};

describe('ABM de personas', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/v1/personas');
    expect(res.status).toBe(401);
  });

  it('crea una persona (happy path)', async () => {
    const res = await request(app)
      .post('/api/v1/personas')
      .set('Authorization', `Bearer ${userToken}`)
      .send(personaPayload);

    expect(res.status).toBe(201);
    expect(res.body.dni).toBe(personaPayload.dni);
  });

  it('responde 409 si el DNI ya existe', async () => {
    const res = await request(app)
      .post('/api/v1/personas')
      .set('Authorization', `Bearer ${userToken}`)
      .send(personaPayload);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PERSONA_DNI_DUPLICADO');
  });

  it('lista personas paginado', async () => {
    const res = await request(app)
      .get('/api/v1/personas?page=0&size=10')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.content.length).toBeGreaterThan(0);
    expect(res.body).toMatchObject({ page: 0, size: 10 });
  });

  it('responde 404 al buscar una persona inexistente', async () => {
    const res = await request(app)
      .get('/api/v1/personas/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PERSONA_NO_ENCONTRADA');
  });

  it('actualiza parcialmente una persona', async () => {
    const list = await request(app)
      .get('/api/v1/personas?q=Juana')
      .set('Authorization', `Bearer ${userToken}`);
    const id = list.body.content[0].id;

    const res = await request(app)
      .patch(`/api/v1/personas/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ telefono: '1199998888' });

    expect(res.status).toBe(200);
    expect(res.body.telefono).toBe('1199998888');
  });

  it('responde 403 al borrar con un usuario USER', async () => {
    const list = await request(app)
      .get('/api/v1/personas?q=Juana')
      .set('Authorization', `Bearer ${userToken}`);
    const id = list.body.content[0].id;

    const res = await request(app)
      .delete(`/api/v1/personas/${id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('hace soft delete con un usuario ADMIN', async () => {
    const list = await request(app)
      .get('/api/v1/personas?q=Juana')
      .set('Authorization', `Bearer ${userToken}`);
    const id = list.body.content[0].id;

    const res = await request(app)
      .delete(`/api/v1/personas/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/v1/personas/${id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(getRes.body.activo).toBe(false);
  });
});
