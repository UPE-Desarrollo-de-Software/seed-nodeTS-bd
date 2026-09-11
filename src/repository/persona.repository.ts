/**
 * repository/persona.repository.ts
 * ---------------------------------------------------------------------
 * Fachada delgada sobre `prisma.persona`. Cada función es prácticamente
 * un one-liner que envuelve una llamada a Prisma — a propósito: este
 * archivo NO tiene lógica de negocio (eso vive en
 * `service/persona.service.ts`, que es quien lo consume), su único trabajo
 * es traducir "necesito estas filas" a la llamada de Prisma exacta.
 *
 * `findMany`/`count` reciben `where`/`orderBy`/`skip`/`take` ya armados
 * por el service (que a su vez los arma con `util/pagination.util.ts`) en
 * vez de recibir los filtros "crudos" (`page`, `q`, etc.) — así este
 * archivo no necesita saber nada de paginación ni de cómo se arma un
 * filtro de búsqueda, solo ejecuta la query que le piden.
 *
 * `softDelete` no borra la fila: pone `activo = false` (baja lógica, ver
 * `DELETE /personas/:id` en el README).
 *
 * Se exporta como un objeto singleton (`personaRepository`) en vez de una
 * clase instanciable — no hay contenedor de DI en este proyecto, ver la
 * sección "Inyección de dependencias" del README.
 */
import { prisma } from '../db/client.js';
import type { Prisma, Persona } from '../db/generated/client.js';

async function findMany(args: {
  where: Prisma.PersonaWhereInput;
  orderBy: Prisma.PersonaOrderByWithRelationInput;
  skip: number;
  take: number;
}): Promise<Persona[]> {
  return prisma.persona.findMany(args);
}

async function count(where: Prisma.PersonaWhereInput): Promise<number> {
  return prisma.persona.count({ where });
}

async function findById(id: string): Promise<Persona | null> {
  return prisma.persona.findUnique({ where: { id } });
}

async function findByDni(dni: string): Promise<Persona | null> {
  return prisma.persona.findUnique({ where: { dni } });
}

async function create(data: Prisma.PersonaCreateInput): Promise<Persona> {
  return prisma.persona.create({ data });
}

async function update(id: string, data: Prisma.PersonaUpdateInput): Promise<Persona> {
  return prisma.persona.update({ where: { id }, data });
}

async function softDelete(id: string): Promise<Persona> {
  return prisma.persona.update({ where: { id }, data: { activo: false } });
}

export const personaRepository = {
  findMany,
  count,
  findById,
  findByDni,
  create,
  update,
  softDelete,
};
