#!/bin/sh
# docker/entrypoint.sh
# ---------------------------------------------------------------------
# Lo que corre CADA VEZ que arranca el contenedor de la API (tanto en
# modo "producción-like" como en desarrollo, ver docker-compose.yml /
# docker-compose.override.yml): aplica las migraciones pendientes,
# corre el seed (usuario admin + personas de ejemplo), y recién ahí
# ejecuta el comando real del contenedor ("$@", que es el CMD del
# Dockerfile o lo que lo haya pisado — `node dist/server.js` en
# producción, `tsx watch src/server.ts` en desarrollo).
#
# `set -e`: si migrate o el seed fallan, el script corta ahí y el
# contenedor no llega a levantar el servidor con una base a medio
# migrar.
#
# Usa los binarios de node_modules/.bin directo (no `pnpm exec`) porque
# es un pelín más rápido al no pasar por pnpm para resolver el comando.
set -e

echo "[entrypoint] aplicando migraciones..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] corriendo seed..."
node_modules/.bin/tsx prisma/seed.ts

echo "[entrypoint] arrancando servidor..."
exec "$@"
