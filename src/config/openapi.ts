/**
 * config/openapi.ts
 * ---------------------------------------------------------------------
 * Arma el documento OpenAPI 3.1 que se sirve en GET /api/docs.json (y que
 * Swagger UI renderiza en GET /api/docs, ver app.ts). La idea central de
 * este archivo — y de toda la sección 10 del spec original — es que el
 * documento NO se escribe a mano: se construye con `createDocument` de
 * `zod-openapi` a partir de los mismos schemas de zod que ya usan los DTOs
 * para validar requests (carpeta `dto/`). Si un endpoint no aparece acá, el
 * bug está en el `paths`/`components.schemas` de abajo, nunca en un YAML
 * aparte que se desincroniza con el código.
 *
 * Cada entrada de `paths` es deliberadamente explícita (método, tags,
 * requestBody/requestParams, responses por status code) en vez de inferirse
 * sola: así queda documentado a mano qué status codes puede devolver cada
 * endpoint, que es información que ni el router ni los schemas de zod
 * conocen por sí solos.
 */
import { createDocument } from 'zod-openapi';
import { registerRequestSchema } from '../dto/auth/register.request.js';
import { loginRequestSchema } from '../dto/auth/login.request.js';
import { loginResponseSchema, authUserSchema } from '../dto/auth/login.response.js';
import { refreshRequestSchema } from '../dto/auth/refresh.request.js';
import { pageRequestSchema } from '../dto/common/page.request.js';
import { errorResponseSchema } from '../dto/common/error.response.js';
import { createPersonaRequestSchema } from '../dto/persona/create-persona.request.js';
import {
  patchPersonaRequestSchema,
  updatePersonaRequestSchema,
} from '../dto/persona/update-persona.request.js';
import { personaResponseSchema } from '../dto/persona/persona.response.js';
import { personaPageResponseSchema } from '../dto/persona/persona-page.response.js';

const bearerAuth = { bearerAuth: [] as string[] };

export const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'API Seed',
    version: '0.1.0',
    description: 'Semilla de API REST con autenticación JWT y ABM de Persona.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      RegisterRequest: registerRequestSchema,
      LoginRequest: loginRequestSchema,
      LoginResponse: loginResponseSchema,
      AuthUser: authUserSchema,
      RefreshRequest: refreshRequestSchema,
      PageRequest: pageRequestSchema,
      ErrorResponse: errorResponseSchema,
      CreatePersonaRequest: createPersonaRequestSchema,
      UpdatePersonaRequest: updatePersonaRequestSchema,
      PatchPersonaRequest: patchPersonaRequestSchema,
      PersonaResponse: personaResponseSchema,
      PersonaPageResponse: personaPageResponseSchema,
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Crea un usuario',
        requestBody: { content: { 'application/json': { schema: registerRequestSchema } } },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: authUserSchema } } },
          409: { description: 'El email ya existe', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Autentica un usuario',
        requestBody: { content: { 'application/json': { schema: loginRequestSchema } } },
        responses: {
          200: { description: 'Access y refresh token', content: { 'application/json': { schema: loginResponseSchema } } },
          401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['auth'],
        summary: 'Rota el refresh token',
        requestBody: { content: { 'application/json': { schema: refreshRequestSchema } } },
        responses: {
          200: { description: 'Nuevo par de tokens', content: { 'application/json': { schema: loginResponseSchema.pick({ accessToken: true, refreshToken: true }) } } },
          401: { description: 'Token revocado o vencido', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['auth'],
        summary: 'Revoca el refresh token recibido',
        security: [bearerAuth],
        requestBody: { content: { 'application/json': { schema: refreshRequestSchema } } },
        responses: {
          204: { description: 'Sesión cerrada' },
          401: { description: 'No autenticado', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'Datos del usuario autenticado',
        security: [bearerAuth],
        responses: {
          200: { description: 'Usuario actual', content: { 'application/json': { schema: authUserSchema } } },
          401: { description: 'No autenticado', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/personas': {
      get: {
        tags: ['personas'],
        summary: 'Listado paginado de personas',
        security: [bearerAuth],
        requestParams: { query: pageRequestSchema },
        responses: {
          200: { description: 'Página de personas', content: { 'application/json': { schema: personaPageResponseSchema } } },
        },
      },
      post: {
        tags: ['personas'],
        summary: 'Crea una persona',
        security: [bearerAuth],
        requestBody: { content: { 'application/json': { schema: createPersonaRequestSchema } } },
        responses: {
          201: { description: 'Persona creada', content: { 'application/json': { schema: personaResponseSchema } } },
          409: { description: 'DNI duplicado', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
    '/personas/{id}': {
      get: {
        tags: ['personas'],
        summary: 'Obtiene una persona por id',
        security: [bearerAuth],
        responses: {
          200: { description: 'Persona encontrada', content: { 'application/json': { schema: personaResponseSchema } } },
          404: { description: 'No existe', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
      put: {
        tags: ['personas'],
        summary: 'Actualización total',
        security: [bearerAuth],
        requestBody: { content: { 'application/json': { schema: updatePersonaRequestSchema } } },
        responses: {
          200: { description: 'Persona actualizada', content: { 'application/json': { schema: personaResponseSchema } } },
          404: { description: 'No existe', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
      patch: {
        tags: ['personas'],
        summary: 'Actualización parcial',
        security: [bearerAuth],
        requestBody: { content: { 'application/json': { schema: patchPersonaRequestSchema } } },
        responses: {
          200: { description: 'Persona actualizada', content: { 'application/json': { schema: personaResponseSchema } } },
          404: { description: 'No existe', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
      delete: {
        tags: ['personas'],
        summary: 'Soft delete (activo = false)',
        security: [bearerAuth],
        responses: {
          204: { description: 'Eliminada lógicamente' },
          403: { description: 'Requiere rol ADMIN', content: { 'application/json': { schema: errorResponseSchema } } },
          404: { description: 'No existe', content: { 'application/json': { schema: errorResponseSchema } } },
        },
      },
    },
  },
});
