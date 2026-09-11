/**
 * app.ts
 * ---------------------------------------------------------------------
 * Arma la aplicación de Express — TODO el cableado de middlewares y
 * rutas vive acá, en un solo lugar, en el orden exacto en que se aplican
 * (el orden importa: un middleware solo ve lo que dejaron pasar los de
 * arriba). A propósito, `createApp()` NUNCA llama a `.listen(...)` — eso
 * es trabajo de `server.ts`, que sí conoce el puerto y el ciclo de vida
 * del proceso. Separarlos así es lo que permite que los tests de
 * integración (`tests/integration/*.test.ts`) importen `createApp()` y le
 * peguen requests con supertest sin levantar un puerto real.
 *
 * Orden de middlewares (cada uno explicado en su propio archivo):
 *   1. `requestId`            - le pone un id de correlación a cada request.
 *   2. `pinoHttp`              - loguea cada request/response, con ese id.
 *   3. `helmet`                 - cabeceras de seguridad HTTP.
 *   4. `cors`                    - qué orígenes pueden llamar a la API.
 *   5. `express.json()`           - parsea el body como JSON.
 *   6. (rutas)                     - `/health`, `/api/docs*`, `/api/v1/*`.
 *   7. `errorHandler`                - SIEMPRE al final: es quien atrapa
 *      cualquier excepción que haya tirado algo de los pasos anteriores.
 */
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger.js';
import { helmetOptions, corsOptions } from './config/security.js';
import { openApiDocument } from './config/openapi.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './route/index.js';
import { healthRoutes } from './route/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: (req as { requestId?: string }).requestId }),
    }),
  );
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(express.json());

  // Rate limiting: fuera de alcance de esta semilla (ver sección "Fuera de
  // alcance" del README). Acá es donde iría un middleware como
  // `express-rate-limit`, antes de las rutas y después de `cors`.

  // Health-check por fuera de `/api/v1`: un orquestador no debería
  // depender del versionado de la API para saber si el proceso está vivo.
  app.use('/health', healthRoutes);

  // Documentación: el JSON es el propio `openApiDocument` armado en
  // config/openapi.ts a partir de los schemas de `dto/`; Swagger UI solo
  // lo renderiza, no agrega nada nuevo.
  app.use('/api/docs.json', (_req, res) => res.json(openApiDocument));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Toda la API de negocio, versionada bajo /api/v1 (ver route/index.ts).
  app.use('/api/v1', apiRouter);

  // Último middleware, con 4 parámetros: Express lo reconoce como error
  // handler y lo salta hasta acá cualquier `throw`/reject de los handlers
  // de arriba (Express 5 propaga solo los de handlers async, así que no
  // hace falta `express-async-errors` ni try/catch manual en cada
  // controller — ver middleware/error-handler.ts para el detalle).
  app.use(errorHandler);

  return app;
}
