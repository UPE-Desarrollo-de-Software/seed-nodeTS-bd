/**
 * config/env.ts
 * ---------------------------------------------------------------------
 * Única fuente de verdad de la configuración del proceso: lee
 * `process.env`, lo valida con zod y expone un objeto `env` ya tipado y
 * con los valores por defecto aplicados. Todo el resto del código importa
 * `env` desde acá — nadie más en `src/` debería leer `process.env` directo,
 * así hay un solo lugar donde se sabe qué variables existen y qué forma
 * tienen (ver `.env.example` en la raíz para la lista completa comentada).
 *
 * Si falta una variable obligatoria (o tiene un formato inválido), `loadEnv`
 * tira una excepción apenas se importa este módulo — es decir, el proceso
 * ni siquiera llega a levantar el servidor. Es a propósito: preferimos que
 * falle rápido y explícito al arrancar, no a mitad de un request.
 */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Configuración de entorno inválida:\n${issues}`);
    throw new Error('Configuración de entorno inválida. Revisar variables de entorno.');
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = typeof env;
