/**
 * tests/setup.ts
 * ---------------------------------------------------------------------
 * `setupFiles` de Vitest (ver vitest.config.ts) — corre antes de CADA
 * archivo de test, en su propio contexto de módulos. Levanta un Postgres
 * real y descartable con Testcontainers (requiere Docker corriendo en la
 * máquina/CI), le corre las migraciones reales de `prisma/migrations/`, y
 * deja `DATABASE_URL`/`JWT_SECRET`/`NODE_ENV` seteados en `process.env`
 * para que el resto del test pueda levantar la app contra esa base.
 *
 * Por qué Testcontainers y no mockear Prisma: el spec de esta semilla es
 * explícito en no mockear Prisma — los tests de integración
 * (`tests/integration/*.test.ts`) corren contra una base real para
 * detectar problemas que un mock nunca mostraría (constraints violados,
 * tipos de columna, comportamiento real de `upsert`, etc.).
 *
 * Dato importante para quien escriba un test nuevo: `config/env.ts` valida
 * `process.env` y tira una excepción AL IMPORTARSE si falta algo — por
 * eso los archivos de test NUNCA importan `../../src/app.js` de forma
 * estática arriba del archivo, sino con `await import(...)` dentro de un
 * `beforeAll` propio, después de que este `setup.ts` ya corrió y dejó las
 * variables seteadas (ver tests/integration/auth.test.ts para el patrón
 * exacto).
 */
import { execSync } from 'node:child_process';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { beforeAll, afterAll } from 'vitest';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('seed_db_test')
    .withUsername('seed')
    .withPassword('seed')
    .start();

  const databaseUrl = container.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'test-secret-de-al-menos-32-caracteres-largo';
  process.env.NODE_ENV = 'test';

  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}, 120_000);

afterAll(async () => {
  await container?.stop();
});
