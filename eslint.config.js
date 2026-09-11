// eslint.config.js
// ---------------------------------------------------------------------
// Config "flat" de ESLint 9 (ya no `.eslintrc`). Además de las reglas
// recomendadas de ESLint y typescript-eslint, la parte importante de
// este archivo es `import/no-restricted-paths`: es la regla que hace
// CUMPLIR en build-time la arquitectura en capas descripta en el README
// (route -> controller -> service -> repository -> db). Si alguien
// importa, por ejemplo, `db/client.ts` desde un controller, `pnpm lint`
// falla con el mensaje de esa zona — no es solo una convención escrita en
// un doc, se rompe el build.
//
// Nota: esta regla no puede expresar TODA la tabla de dependencias del
// README (por ejemplo, no hay una zona para "dto no importa service"
// porque zod-openapi hace que algunos DTOs referencien otros DTOs entre
// sí, lo cual es válido) — cubre los cruces más importantes y más fáciles
// de romper sin querer.
// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'src/db/generated/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/service',
              from: './src/controller',
              message: 'service no puede importar controller.',
            },
            {
              target: './src/service',
              from: './src/route',
              message: 'service no puede importar route.',
            },
            {
              target: './src/service',
              from: 'express',
              message: 'service no puede importar express.',
            },
            {
              target: './src/repository',
              from: './src/service',
              message: 'repository no puede importar service.',
            },
            {
              target: './src/controller',
              from: './src/db',
              message: 'controller no puede acceder a Prisma directamente.',
            },
          ],
        },
      ],
    },
  },
);
