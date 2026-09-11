/**
 * controller/persona.controller.ts
 * ---------------------------------------------------------------------
 * Traduce HTTP <-> dominio del ABM de Persona. Mismo patrón que
 * `auth.controller.ts`: lee de `req`, delega en
 * `service/persona.service.ts`, mapea la respuesta con
 * `mapper/persona.mapper.ts`. Sin lógica de negocio ni Prisma acá.
 *
 * `list` lee `req.validatedQuery` (no `req.query`) porque en Express 5
 * `req.query` es un getter sin setter que no se puede "dejar validado" —
 * ver la explicación completa en `middleware/validate.ts`.
 *
 * `req.params.id as string`: Express tipa los params como
 * `string | undefined` bajo `noUncheckedIndexedAccess` (ver tsconfig.json)
 * aunque la ruta declare `:id` como obligatorio; el cast es seguro porque
 * si no vino `:id` en la URL, Express ni siquiera matchea la ruta.
 */
import type { Request, Response } from 'express';
import { personaService } from '../service/persona.service.js';
import { toPersonaResponse } from '../mapper/persona.mapper.js';
import type { PageRequest } from '../dto/common/page.request.js';
import type { CreatePersonaRequest } from '../dto/persona/create-persona.request.js';
import type {
  PatchPersonaRequest,
  UpdatePersonaRequest,
} from '../dto/persona/update-persona.request.js';

async function list(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as PageRequest;
  const page = await personaService.list(query);
  res.status(200).json({
    ...page,
    content: page.content.map(toPersonaResponse),
  });
}

async function getById(req: Request, res: Response): Promise<void> {
  const persona = await personaService.getById(req.params.id as string);
  res.status(200).json(toPersonaResponse(persona));
}

async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreatePersonaRequest;
  const persona = await personaService.create(body);
  res.status(201).json(toPersonaResponse(persona));
}

async function replace(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdatePersonaRequest;
  const persona = await personaService.replace(req.params.id as string, body);
  res.status(200).json(toPersonaResponse(persona));
}

async function patch(req: Request, res: Response): Promise<void> {
  const body = req.body as PatchPersonaRequest;
  const persona = await personaService.patch(req.params.id as string, body);
  res.status(200).json(toPersonaResponse(persona));
}

async function remove(req: Request, res: Response): Promise<void> {
  await personaService.softDelete(req.params.id as string);
  res.status(204).send();
}

export const personaController = {
  list,
  getById,
  create,
  replace,
  patch,
  remove,
};
