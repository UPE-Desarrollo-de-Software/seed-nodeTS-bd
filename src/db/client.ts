/**
 * db/client.ts
 * ---------------------------------------------------------------------
 * Instancia única de PrismaClient para todo el proceso. Este es EL ÚNICO
 * archivo del proyecto (fuera de `db/generated/`) que debería importar
 * `./generated/client.js` para crear un cliente — todo lo demás que
 * necesita hablar con la base importa `prisma` desde acá (y en la práctica,
 * solo `repository/*.ts` lo hace: ver la regla de capas en el README).
 *
 * Dos detalles de Prisma 7 que valen la pena remarcar:
 *   1. El cliente generado vive en `db/generated/` (carpeta gitignored,
 *      la regenera `prisma generate`), no en `node_modules/@prisma/client`
 *      como en versiones anteriores. Por eso el import de arriba es
 *      relativo (`./generated/client.js`) y no `@prisma/client`.
 *   2. La conexión ya no se arma sola a partir de `datasource.url` en
 *      schema.prisma (eso quedó deprecado) — hay que instanciar un driver
 *      adapter (`PrismaPg`, del paquete `@prisma/adapter-pg`) pasándole la
 *      connection string de `env.DATABASE_URL`, y dárselo al constructor
 *      de `PrismaClient`.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';
import { env } from '../config/env.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
