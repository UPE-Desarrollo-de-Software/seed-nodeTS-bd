# docker/Dockerfile
# ---------------------------------------------------------------------
# Build multi-stage en 3 etapas (deps -> build -> runtime), pensado para
# que la imagen final sea chica y no lleve herramientas de build. Lo
# arma `docker-compose.yml` (etapa `runtime`, la que se usa por default)
# y `docker-compose.override.yml` (etapa `build`, para desarrollo con
# hot reload — ver ese archivo para el detalle).
#
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- deps -----------------------------------------------------------
# Instala dependencias en una capa propia, separada de copiar el código
# fuente: mientras no cambien package.json/pnpm-lock.yaml, Docker cachea
# esta capa entera y no vuelve a correr `pnpm install` en cada build.
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------
# Copia el código fuente recién acá (después de instalar deps, por el
# cacheo de capas explicado arriba), genera el cliente de Prisma
# (necesario para que `tsc` pueda tipar los imports de `db/generated/`) y
# compila TypeScript a `dist/`.
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build
RUN chmod +x ./docker/entrypoint.sh

# ---- runtime ------------------------------------------------------------
# Imagen final: solo lo que hace falta para correr, no para compilar.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# NOTA: el entrypoint corre `prisma migrate deploy` y `db:seed` (tsx) al
# arrancar, así que conservamos node_modules completo (con las devDependencies
# `prisma` y `tsx`) en vez de una instalación --prod. Es la única excepción a
# "solo producción" y está documentada acá a propósito.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY docker/entrypoint.sh ./entrypoint.sh

# Corre como usuario no root (`node`, que ya viene en la imagen base de
# Node) — buena práctica estándar de seguridad en contenedores.
RUN chmod +x ./entrypoint.sh && chown -R node:node /app

USER node
EXPOSE 3000

# El entrypoint corre las migraciones + el seed y después ejecuta lo que
# venga en CMD (ver docker/entrypoint.sh) — así `docker-compose.override.yml`
# puede pisar el CMD (para correr `tsx watch` en vez de `node dist/server.js`)
# sin tener que reimplementar la lógica de migrar+seedear.
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]
