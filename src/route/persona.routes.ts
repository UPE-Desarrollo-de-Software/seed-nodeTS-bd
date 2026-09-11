/**
 * route/persona.routes.ts
 * ---------------------------------------------------------------------
 * Mapeo path -> handler del ABM de Persona, montado bajo
 * `/api/v1/personas` (ver route/index.ts). `personaRoutes.use(authenticate)`
 * al principio hace que TODAS las rutas de este router exijan sesión, sin
 * tener que repetir `authenticate` en cada línea.
 *
 *   GET    /            - listado paginado (query validada con
 *                          pageRequestSchema: page/size/sort/q/activo)
 *   GET    /:id          - detalle
 *   POST   /             - alta (createPersonaRequestSchema)
 *   PUT    /:id           - actualización total (updatePersonaRequestSchema)
 *   PATCH  /:id           - actualización parcial (patchPersonaRequestSchema)
 *   DELETE /:id           - baja lógica, además exige rol ADMIN
 *                          (`authorize(Rol.ADMIN)` se suma solo en esta
 *                          línea, no en `use(...)`, porque es la única
 *                          ruta con esa restricción extra)
 */
import { Router } from 'express';
import { personaController } from '../controller/persona.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { pageRequestSchema } from '../dto/common/page.request.js';
import { createPersonaRequestSchema } from '../dto/persona/create-persona.request.js';
import {
  patchPersonaRequestSchema,
  updatePersonaRequestSchema,
} from '../dto/persona/update-persona.request.js';
import { Rol } from '../model/enums/rol.enum.js';

export const personaRoutes = Router();

personaRoutes.use(authenticate);

personaRoutes.get('/', validate(pageRequestSchema, 'query'), personaController.list);
personaRoutes.get('/:id', personaController.getById);
personaRoutes.post('/', validate(createPersonaRequestSchema), personaController.create);
personaRoutes.put('/:id', validate(updatePersonaRequestSchema), personaController.replace);
personaRoutes.patch('/:id', validate(patchPersonaRequestSchema), personaController.patch);
personaRoutes.delete('/:id', authorize(Rol.ADMIN), personaController.remove);
