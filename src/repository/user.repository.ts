/**
 * repository/user.repository.ts
 * ---------------------------------------------------------------------
 * Fachada sobre `prisma.user`, usada por `service/auth.service.ts` para
 * registrar usuarios y para buscar el usuario dueño de un email/id al
 * loguear, refrescar sesión o pedir `/auth/me`. Sin lógica de negocio acá
 * (no valida si el email ya existe, no verifica el password): eso es
 * responsabilidad del service.
 */
import { prisma } from '../db/client.js';
import type { Prisma, User } from '../db/generated/client.js';

async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

async function create(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export const userRepository = {
  findByEmail,
  findById,
  create,
};
