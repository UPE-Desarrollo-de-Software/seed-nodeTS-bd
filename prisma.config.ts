/**
 * prisma.config.ts
 * ---------------------------------------------------------------------
 * Solo lo usa la CLI de Prisma (`prisma migrate dev/deploy`,
 * `prisma studio`, `prisma db seed`) — la app en runtime (`src/server.ts`)
 * NO lee este archivo, arma su conexión directo en `src/db/client.ts`
 * leyendo `config/env.ts`.
 *
 * Dos cosas que cambiaron en Prisma 7 y por eso este archivo existe:
 *   1. La CLI ya no carga `.env` sola — de ahí el `import 'dotenv/config'`
 *      de arriba, que lo hace explícito.
 *   2. `datasource.url` en `schema.prisma` quedó deprecado — la connection
 *      string que usa la CLI se declara acá, en `datasource.url` de este
 *      objeto de configuración.
 *
 * `migrations.seed` es el comando que corre `prisma db seed` (y también
 * el que corre automáticamente Prisma después de un `migrate dev` o un
 * `migrate reset`) — apunta a `prisma/seed.ts`.
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
