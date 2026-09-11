/**
 * prisma/seed.ts
 * ---------------------------------------------------------------------
 * Datos iniciales de la base: un usuario ADMIN y 3 Personas de ejemplo.
 * Se corre con `pnpm db:seed` (fuera de Docker) o automáticamente al
 * arrancar el contenedor de la API (ver docker/entrypoint.sh, que lo
 * corre después de `prisma migrate deploy` y antes de levantar el
 * servidor).
 *
 * Es idempotente a propósito: usa `upsert` (por email en User, por dni en
 * Persona) en vez de `create`, así se puede correr las veces que haga
 * falta —cada arranque del contenedor, por ejemplo— sin que falle por
 * violar el `@unique` de la segunda vez ni duplicar filas.
 *
 * Este archivo instancia su PROPIO PrismaClient (con su propio adapter),
 * en vez de importar `src/db/client.ts` — a propósito: `db/client.ts` lee
 * la connection string de `config/env.ts`, que valida TODAS las variables
 * de entorno de la app (JWT_SECRET incluido). El seed es un script
 * standalone que en teoría solo necesita `DATABASE_URL`, así que arma su
 * propio cliente para no depender de tener seteadas variables que no le
 * hacen falta.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient, Rol } from '../src/db/generated/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL es obligatorio para correr el seed.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await argon2.hash('Admin123!');

  await prisma.user.upsert({
    where: { email: 'admin@seed.local' },
    update: {},
    create: {
      email: 'admin@seed.local',
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  const personas = [
    {
      nombre: 'Ana',
      apellido: 'García',
      dni: '30111222',
      email: 'ana.garcia@example.com',
      telefono: '1122334455',
      fechaNacimiento: new Date('1990-05-12'),
    },
    {
      nombre: 'Bruno',
      apellido: 'Fernández',
      dni: '32222333',
      email: 'bruno.fernandez@example.com',
      telefono: '1133445566',
      fechaNacimiento: new Date('1988-11-03'),
    },
    {
      nombre: 'Carla',
      apellido: 'Martínez',
      dni: '34333444',
      email: 'carla.martinez@example.com',
      telefono: '1144556677',
      fechaNacimiento: new Date('1995-02-20'),
    },
  ];

  for (const persona of personas) {
    await prisma.persona.upsert({
      where: { dni: persona.dni },
      update: {},
      create: persona,
    });
  }

  console.log('Seed aplicado correctamente.');
}

main()
  .catch((err) => {
    console.error('Falló el seed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
