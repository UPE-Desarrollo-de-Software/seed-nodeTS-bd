/**
 * service/persona.service.ts
 * ---------------------------------------------------------------------
 * Lógica de negocio del ABM de Persona — el módulo de ejemplo de esta
 * semilla, el que hay que mirar como plantilla al agregar un módulo nuevo
 * (ver "Cómo agregar un módulo nuevo" en el README). Como todo `service/`,
 * no importa `express`: recibe/devuelve tipos de `model/`+`dto/` y lanza
 * excepciones de `exception/`; es `controller/persona.controller.ts` quien
 * lo conecta con HTTP.
 *
 * `buildWhere` + `list`: arman el filtro de Prisma a partir de los
 * filtros ya validados (`q` busca por nombre/apellido — insensible a
 * mayúsculas — o por DNI; `activo` filtra por estado) y delegan la
 * paginación a `util/pagination.util.ts` (`parseSort`, `toSkipTake`,
 * `buildPage`), que es quien sabe la forma exacta de la respuesta
 * paginada.
 *
 * `assertDniDisponible` es el helper que reusan `create`, `replace` y
 * `patch` para chequear el DNI duplicado ANTES de pegarle a la base con un
 * insert/update que fallaría con una violación de constraint UNIQUE — así
 * el mensaje de error (`PERSONA_DNI_DUPLICADO`) es más claro que el `P2002`
 * genérico que armaría `middleware/error-handler.ts` si se dejara fallar
 * a Prisma. El parámetro `excludeId` es para permitir "actualizar una
 * persona con su propio DNI sin que se queje de que está duplicado".
 *
 * `replace` (PUT, actualización total) vs. `patch` (PATCH, parcial): la
 * diferencia real está en el DTO que reciben (`UpdatePersonaRequest` exige
 * todos los campos, `PatchPersonaRequest` los tiene todos opcionales — ver
 * `dto/persona/update-persona.request.ts`), acá simplemente `replace`
 * siempre manda los 6 campos y `patch` solo lo que vino en el body.
 *
 * `softDelete` no borra la fila: pone `activo = false` (ver
 * `repository/persona.repository.ts`).
 */
import { personaRepository } from '../repository/persona.repository.js';
import { NotFoundException } from '../exception/not-found.exception.js';
import { ConflictException } from '../exception/conflict.exception.js';
import { buildPage, parseSort, toSkipTake, type Page } from '../util/pagination.util.js';
import type { Persona, PersonaFiltros } from '../model/persona.model.js';
import type { CreatePersonaRequest } from '../dto/persona/create-persona.request.js';
import type {
  PatchPersonaRequest,
  UpdatePersonaRequest,
} from '../dto/persona/update-persona.request.js';
import type { Prisma } from '../db/generated/client.js';

const SORTABLE_FIELDS = ['apellido', 'nombre', 'createdAt', 'fechaNacimiento'] as const;

function buildWhere(filtros: Pick<PersonaFiltros, 'q' | 'activo'>): Prisma.PersonaWhereInput {
  const where: Prisma.PersonaWhereInput = {};
  if (filtros.activo !== undefined) {
    where.activo = filtros.activo;
  }
  if (filtros.q) {
    where.OR = [
      { nombre: { contains: filtros.q, mode: 'insensitive' } },
      { apellido: { contains: filtros.q, mode: 'insensitive' } },
      { dni: { contains: filtros.q } },
    ];
  }
  return where;
}

async function list(filtros: PersonaFiltros): Promise<Page<Persona>> {
  const where = buildWhere(filtros);
  const orderBy = parseSort(filtros.sort, SORTABLE_FIELDS, 'apellido');
  const { skip, take } = toSkipTake(filtros);

  const [content, totalElements] = await Promise.all([
    personaRepository.findMany({ where, orderBy, skip, take }),
    personaRepository.count(where),
  ]);

  return buildPage(content, totalElements, filtros);
}

async function getById(id: string): Promise<Persona> {
  const persona = await personaRepository.findById(id);
  if (!persona) {
    throw new NotFoundException(`No existe una persona con id ${id}`, 'PERSONA_NO_ENCONTRADA');
  }
  return persona;
}

async function assertDniDisponible(dni: string, excludeId?: string): Promise<void> {
  const existing = await personaRepository.findByDni(dni);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      `Ya existe una persona con el DNI ${dni}`,
      'PERSONA_DNI_DUPLICADO',
    );
  }
}

async function create(input: CreatePersonaRequest): Promise<Persona> {
  await assertDniDisponible(input.dni);
  return personaRepository.create({
    nombre: input.nombre,
    apellido: input.apellido,
    dni: input.dni,
    email: input.email,
    telefono: input.telefono,
    fechaNacimiento: input.fechaNacimiento,
  });
}

async function replace(id: string, input: UpdatePersonaRequest): Promise<Persona> {
  await getById(id);
  await assertDniDisponible(input.dni, id);
  return personaRepository.update(id, {
    nombre: input.nombre,
    apellido: input.apellido,
    dni: input.dni,
    email: input.email ?? null,
    telefono: input.telefono ?? null,
    fechaNacimiento: input.fechaNacimiento,
  });
}

async function patch(id: string, input: PatchPersonaRequest): Promise<Persona> {
  await getById(id);
  if (input.dni) {
    await assertDniDisponible(input.dni, id);
  }
  return personaRepository.update(id, { ...input });
}

async function softDelete(id: string): Promise<void> {
  await getById(id);
  await personaRepository.softDelete(id);
}

export const personaService = {
  list,
  getById,
  create,
  replace,
  patch,
  softDelete,
};
