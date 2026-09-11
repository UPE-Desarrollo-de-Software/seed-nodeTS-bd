/**
 * vitest.config.ts
 * ---------------------------------------------------------------------
 * `setupFiles: ['./tests/setup.ts']` hace que Vitest corra ese archivo
 * antes de CADA archivo de test (ver tests/setup.ts para qué hace:
 * levanta un Postgres con Testcontainers y corre las migraciones).
 *
 * `fileParallelism: false` es a propósito: cada archivo de test levanta
 * su PROPIO contenedor de Postgres (más lento, pero simple y con
 * aislamiento total entre archivos — nada de estado compartido entre
 * `auth.test.ts` y `persona.test.ts`). Si se corrieran en paralelo, cada
 * uno seguiría teniendo su propio contenedor igual, así que el único
 * costo real de esta opción es tiempo total de test run, no correctitud
 * — se prefirió así para mantener el setup simple en una semilla.
 *
 * `testTimeout`/`hookTimeout` están altos (60s/120s) porque levantar un
 * contenedor de Postgres desde cero y correrle las migraciones tarda
 * bastante más que un test unitario típico.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
