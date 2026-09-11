# api-seed

Semilla de API REST en **Node.js + Express 5 + TypeScript + Prisma 7**, pensada
para que un equipo la clone y arranque un microservicio nuevo copiando el
patrón en vez de empezar de cero. Incluye:

- Autenticación **JWT** con access token de corta duración + refresh token
  rotativo y persistido (con detección de reuso).
- Un ABM completo de **Persona** como módulo de negocio de ejemplo — la
  plantilla a copiar para agregar un módulo nuevo.
- Documentación **OpenAPI 3.1** generada a partir de los mismos schemas de
  zod que validan los requests (nunca escrita a mano).
- Entorno de desarrollo levantado íntegramente con **Docker Compose**
  (`docker compose up --build` y ya está: base + migraciones + seed + API).

La carpeta `src/` está organizada por **capas técnicas**
(`controller/`, `service/`, `repository/`, `dto/`, ...) en vez del layout
"por feature" más habitual en proyectos Node — es una decisión deliberada
para que un equipo que viene de Spring Boot / arquitecturas en capas se
sienta en terreno conocido. Cada archivo de `src/` tiene, además, un
comentario de cabecera explicando su rol — este README es el mapa; los
comentarios de cada archivo son el detalle.

---

## Índice

1. [Stack y versiones](#stack-y-versiones)
2. [Requisitos](#requisitos)
3. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
4. [Estructura de carpetas, carpeta por carpeta](#estructura-de-carpetas-carpeta-por-carpeta)
5. [Arquitectura: regla de dependencias entre capas](#arquitectura-regla-de-dependencias-entre-capas)
6. [Modelo de datos](#modelo-de-datos)
7. [Flujo de autenticación](#flujo-de-autenticación)
8. [Endpoints](#endpoints)
9. [Formato de respuestas](#formato-de-respuestas)
10. [Cómo agregar un módulo nuevo](#cómo-agregar-un-módulo-nuevo)
11. [Variables de entorno](#variables-de-entorno)
12. [Scripts de `package.json`](#scripts-de-packagejson)
13. [Docker, explicado archivo por archivo](#docker-explicado-archivo-por-archivo)
14. [Tests](#tests)
15. [Convenciones de código](#convenciones-de-código)
16. [Fuera de alcance](#fuera-de-alcance)
17. [Troubleshooting](#troubleshooting)

---

## Stack y versiones

| Componente | Versión / paquete |
|---|---|
| Runtime | Node.js 22 LTS (mínimo 20.19) |
| Lenguaje | TypeScript 5.7+ |
| Framework HTTP | Express 5.x |
| ORM | Prisma 7.x (generator `prisma-client`, con driver adapters) |
| Base de datos | PostgreSQL 17 |
| Módulos | **ESM** (`"type": "module"` en `package.json`) |
| Gestor de paquetes | pnpm (versión fijada en `packageManager` de `package.json`) |
| Validación | zod 4 + `zod-openapi` (deriva el documento OpenAPI de los mismos schemas) |
| Auth | `jose` (JWT) + `argon2` (hash de passwords) |
| Logging | `pino` + `pino-http` |
| Tests | Vitest + Supertest + Testcontainers |

---

## Requisitos

- **Docker** y **Docker Compose** — para levantar todo sin instalar nada más
  en la máquina.
- Si se quiere correr fuera de Docker: **Node.js 22 LTS** (mínimo 20.19) y
  **pnpm**.
- Para correr los tests: Docker corriendo en la máquina (Testcontainers lo
  necesita, tanto en local como en CI).

---

## Cómo levantar el proyecto

1. Copiar `.env.example` a `.env` (los valores por defecto ya sirven para
   desarrollo local; el archivo tiene comentarios explicando cada variable):

   ```bash
   cp .env.example .env
   ```

2. Levantar todo con Docker Compose:

   ```bash
   docker compose up --build
   ```

   Esto levanta Postgres, espera a que el healthcheck lo dé por sano, y
   recién ahí arranca el contenedor de la API. El **entrypoint** de ese
   contenedor (`docker/entrypoint.sh`) corre `prisma migrate deploy` y el
   seed (`prisma/seed.ts`) antes de levantar el servidor — no hace falta
   ningún paso manual.

   `docker-compose.override.yml` se aplica automáticamente por encima en
   este modo (es el comportamiento default de Docker Compose) y activa hot
   reload: monta `./src` y `./prisma` como volúmenes y corre
   `tsx watch src/server.ts` en vez del build compilado.

3. Con la API arriba:
   - Swagger UI: http://localhost:3000/api/docs
   - OpenAPI JSON: http://localhost:3000/api/docs.json
   - Login de prueba (usuario del seed):
     `POST /api/v1/auth/login` con
     `{ "email": "admin@seed.local", "password": "Admin123!" }`

4. Para bajar todo (y borrar los datos de Postgres):

   ```bash
   docker compose down -v
   ```

### Correr sin Docker

Si se prefiere correr la API directo en la máquina, contra un Postgres
propio:

```bash
pnpm install
pnpm db:migrate   # crea/aplica migraciones en desarrollo
pnpm db:seed      # usuario admin + 3 personas de ejemplo (idempotente)
pnpm dev
```

`prisma.config.ts` es quien le dice a la CLI de Prisma cómo conectarse
(carga `.env` con `dotenv` porque, desde Prisma 7, la CLI ya no lo hace
sola — ver el comentario de ese archivo para el detalle completo).

---

## Estructura de carpetas, carpeta por carpeta

```
api-seed/
├── prisma/
├── src/
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── model/
│   ├── repository/
│   ├── service/
│   ├── client/
│   ├── mapper/
│   ├── middleware/
│   ├── exception/
│   ├── route/
│   ├── util/
│   ├── db/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── tests/
└── docker/
```

Cada subsección de abajo es una carpeta, con qué responsabilidad tiene y
qué hace cada archivo puntual adentro. (Los archivos también tienen su
propio comentario de cabecera con más detalle — esto es el resumen para
orientarse rápido.)

### `prisma/` — schema, migraciones y seed

| Archivo | Qué es |
|---|---|
| `schema.prisma` | El modelo de datos completo: `User`, `RefreshToken`, `Persona` y el enum `Rol`. Ver [Modelo de datos](#modelo-de-datos). Tiene comentarios explicando cada modelo y por qué cada decisión (uuid v7, baja lógica, índices). |
| `migrations/` | Historial de migraciones SQL generadas por `prisma migrate dev`. `migration_lock.toml` fija el provider (`postgresql`) para que Prisma no permita mezclar providers por error. **No se edita a mano** — se genera con `pnpm db:migrate`. |
| `seed.ts` | Datos iniciales: un usuario ADMIN (`admin@seed.local` / `Admin123!`) y 3 Personas de ejemplo. Idempotente (usa `upsert`), se corre solo al arrancar el contenedor Docker o a mano con `pnpm db:seed`. |

### `src/config/` — configuración de arranque

Todo lo que el proceso necesita para arrancar, en un solo lugar.

| Archivo | Qué es |
|---|---|
| `env.ts` | Valida `process.env` con zod y expone `env`, ya tipado y con defaults aplicados. Si falta una variable obligatoria, el proceso ni arranca. **Todo el resto del código lee `env` desde acá — nadie más toca `process.env` directo.** |
| `logger.ts` | Instancia única de `pino`. Tiene `redact` configurado para que nunca se filtre un password/hash/token a los logs, aunque venga anidado en el objeto logueado. |
| `security.ts` | Arma `helmetOptions`, `corsOptions` y `jwtConfig` a partir de `env` — la configuración "de seguridad transversal" que usa `app.ts` y `service/token.service.ts`. |
| `openapi.ts` | Construye el documento OpenAPI 3.1 con `zod-openapi`, a partir de los schemas de `dto/`. Es lo que se sirve en `/api/docs.json` (y Swagger UI en `/api/docs`, ver `app.ts`). |

### `src/controller/` — traduce HTTP ↔ dominio

Reglas: lee del `req`, llama al `service` correspondiente, arma la
respuesta con un `mapper`. **Sin lógica de negocio, sin acceso a Prisma**
(ver la regla de capas más abajo).

| Archivo | Qué es |
|---|---|
| `auth.controller.ts` | Handlers de `POST /auth/register`, `/login`, `/refresh`, `/logout` y `GET /auth/me`. |
| `persona.controller.ts` | Handlers del ABM: `list`, `getById`, `create`, `replace` (PUT), `patch` (PATCH), `remove` (DELETE). |
| `health.controller.ts` | Handlers de `/health/live` y `/health/ready`. Es la única excepción a la regla "controller no toca Prisma": importa `repository/health.repository.ts` directo, salteándose la capa de service, porque para un `SELECT 1` no aportaba nada meter un service intermedio (decisión documentada en el propio archivo). |

### `src/dto/` — contratos de entrada/salida

Un archivo por DTO, y en cada uno: el schema de **zod** (que valida el
request en `middleware/validate.ts`), el **tipo TS inferido**
(`z.infer<typeof schema>`) y el **`.meta({id})`** que lo registra en
OpenAPI — los tres, siempre en el mismo archivo. Nunca se declara una
`interface` a mano separada del validador.

```
dto/
├── auth/
│   ├── login.request.ts       Body de POST /auth/login
│   ├── login.response.ts      Respuesta de login + los DTOs Rol y AuthUser
│   ├── register.request.ts    Body de POST /auth/register
│   └── refresh.request.ts     Body de POST /auth/refresh y /auth/logout
├── persona/
│   ├── create-persona.request.ts   Body de POST /personas (el DTO "base")
│   ├── update-persona.request.ts   PUT (total) y PATCH (parcial, .partial()) derivados del anterior
│   ├── persona.response.ts         Forma pública de una Persona
│   └── persona-page.response.ts    Respuesta paginada de GET /personas
└── common/
    ├── error.response.ts      El ÚNICO formato de error de toda la API
    └── page.request.ts        Query params compartidos por cualquier listado paginado
```

### `src/model/` — tipos de dominio

Reexporta los tipos que genera Prisma (para que el resto del código no
importe `db/generated/` directo) más los tipos que no viven en la base.

| Archivo | Qué es |
|---|---|
| `persona.model.ts` | Reexporta `Persona` (de Prisma) + `PersonaFiltros` (filtros de listado, no es una tabla). |
| `user.model.ts` | Reexporta `User` (de Prisma) + `JwtPayload` (el contenido del access token, tampoco es una tabla). |
| `refresh-token.model.ts` | Reexporta `RefreshToken` (de Prisma) + `TokenPair` (el par access+refresh de una respuesta). |
| `enums/rol.enum.ts` | Reexporta el enum `Rol` (`ADMIN`\|`USER`) generado por Prisma. |

### `src/repository/` — acceso a datos

Fachada delgada sobre Prisma. **Es la única capa que importa
`db/client.ts`** (con la única excepción documentada de
`health.controller.ts`, ver arriba).

| Archivo | Qué es |
|---|---|
| `persona.repository.ts` | CRUD + `findMany`/`count` (para el listado paginado) + `findByDni` (para chequear duplicados) + `softDelete` sobre `prisma.persona`. |
| `user.repository.ts` | `findByEmail`, `findById`, `create` sobre `prisma.user`. |
| `refresh-token.repository.ts` | `create`, `findByTokenHash`, `revoke`, `revokeAllForUser` sobre `prisma.refreshToken` — la persistencia de la rotación con detección de reuso. |
| `health.repository.ts` | Un `SELECT 1` (`ping`), para `GET /health/ready`. |

### `src/service/` — lógica de negocio

**No importa `express`. No conoce `req` ni `res`.** Lanza excepciones de
`exception/`. Esta regla la hace cumplir ESLint (`import/no-restricted-paths`
en `eslint.config.js`), no es solo una convención escrita.

| Archivo | Qué es |
|---|---|
| `auth.service.ts` | Register, login, refresh (rotación + detección de reuso), logout, `me`. El corazón de la autenticación — leerlo entero antes de tocar nada de auth. |
| `token.service.ts` | Todo lo criptográfico: firmar/verificar el access JWT, generar/hashear el refresh token, parsear duraciones tipo `"15m"`/`"7d"`. |
| `persona.service.ts` | Lógica del ABM: filtros de listado, chequeo de DNI duplicado antes de tocar la base, y las operaciones de alta/reemplazo/parche/baja lógica. **La plantilla a copiar para un módulo nuevo.** |

### `src/client/` — consumo de APIs externas

No confundir con `dto/` (contratos propios) ni `repository/` (acceso a
nuestra base): esta carpeta es para integrar servicios de terceros.

| Archivo | Qué es |
|---|---|
| `http-client.ts` | Fábrica de cliente HTTP genérico: timeout + reintentos + logging. Infraestructura reutilizable, sin nada específico de ningún proveedor. |
| `renaper.client.ts` | Cliente de EJEMPLO (no enganchado a ningún endpoint todavía) que muestra el patrón completo: envolver `http-client.ts` con la URL base de un proveedor (en este caso, ficticio: el Registro Nacional de las Personas de Argentina) y devolver datos ya tipados. |
| `dto/renaper-persona.response.ts` | DTO de la respuesta de ese proveedor externo — deliberadamente separado del DTO propio de Persona, porque la forma de los datos de un tercero no tiene por qué coincidir con la nuestra. |

### `src/mapper/` — entity → DTO de respuesta

**Nunca expone campos sensibles.** Es el único lugar que decide qué campos
de una entidad de Prisma salen en una respuesta HTTP.

| Archivo | Qué es |
|---|---|
| `user.mapper.ts` | `User` (con `passwordHash`) → `AuthUser` (`id`, `email`, `rol`). Garantiza que el hash del password nunca sale en una respuesta. |
| `persona.mapper.ts` | `Persona` (con `Date`) → `PersonaResponse` (fechas como string ISO, la forma que espera JSON). |

### `src/middleware/` — transversales

| Archivo | Qué es |
|---|---|
| `request-id.ts` | Primer middleware de la cadena: le pone un `requestId` a cada request (reusando el header `x-request-id` si vino uno). Ese id aparece en cada línea de log y en cada respuesta de error. |
| `validate.ts` | Factory `validate(schema, target)`: conecta un schema de `dto/` con una ruta. Si la validación falla, delega el `ZodError` a `error-handler.ts`. |
| `authenticate.ts` | Lee el header `Authorization: Bearer`, verifica el access token y completa `req.user`. Resuelve "quién sos". |
| `authorize.ts` | Factory `authorize(...roles)`: exige que `req.user.rol` esté en la lista. Resuelve "qué podés hacer" (va siempre después de `authenticate`). |
| `error-handler.ts` | **Último** middleware de la cadena (con 4 parámetros). El único lugar que arma el body de una respuesta de error, para toda la API. Mapea `AppException`, `ZodError` y los errores conocidos de Prisma (`P2002`/`P2025`) a su status code correspondiente. |

### `src/exception/` — excepciones de negocio

Cada una con `statusCode` y `code`. Las lanzan los `service/*.ts`, nunca
los controllers ni los repositories.

| Archivo | Qué es |
|---|---|
| `app.exception.ts` | La clase base (`AppException`) que extienden todas las demás. |
| `not-found.exception.ts` | `NotFoundException` → 404. |
| `conflict.exception.ts` | `ConflictException` → 409 (duplicados). |
| `unauthorized.exception.ts` | `UnauthorizedException` → 401 y `ForbiddenException` → 403, juntas en un archivo porque casi siempre se usan una al lado de la otra. |

### `src/route/` — mapeo path → handler

Declara la cadena de middlewares por ruta. **Sin lógica** — ni siquiera un
`if`.

| Archivo | Qué es |
|---|---|
| `auth.routes.ts` | Rutas de `/auth/*`. |
| `persona.routes.ts` | Rutas de `/personas/*`. Todas exigen `authenticate`; `DELETE` además exige `authorize(Rol.ADMIN)`. |
| `health.routes.ts` | Rutas de `/health/*` (sin auth, para que un orquestador les pueda pegar sin credenciales). |
| `index.ts` | Junta los routers de cada módulo en `apiRouter`, que `app.ts` monta bajo `/api/v1`. **Acá es donde se suma la línea al agregar un módulo nuevo.** |

### `src/util/` — helpers puros

Sin estado, sin I/O.

| Archivo | Qué es |
|---|---|
| `pagination.util.ts` | `toSkipTake`, `buildPage`, `parseSort` — genéricos, reusables por cualquier listado paginado que se agregue. |

### `src/db/` — cliente de Prisma

| Archivo | Qué es |
|---|---|
| `client.ts` | Instancia única de `PrismaClient`, armada con el driver adapter `PrismaPg` y la connection string de `env.DATABASE_URL`. Es el único archivo (fuera de `repository/`) que debería importar esto. |
| `generated/` | El cliente de Prisma generado (`prisma generate`). **Gitignored** — se regenera solo, nunca se edita ni se commitea. |

### `src/types/` — aumentos de tipos de librerías externas

| Archivo | Qué es |
|---|---|
| `express.d.ts` | Le agrega al tipo `Request` de Express los campos que esta app le suma en runtime: `requestId`, `user`, `validatedQuery`. Puro `.d.ts`, no genera código. |

### Archivos sueltos de `src/`

| Archivo | Qué es |
|---|---|
| `app.ts` | Arma la aplicación de Express: todo el cableado de middlewares y rutas, en el orden exacto en que se aplican. **Nunca llama a `.listen(...)`** — eso es trabajo de `server.ts`, justamente para que los tests puedan importar `createApp()` sin levantar un puerto real. |
| `server.ts` | Punto de entrada real del proceso: llama a `createApp().listen(...)` y maneja el apagado ordenado (`SIGTERM`/`SIGINT`) — deja de aceptar conexiones, espera las que ya estaban en curso, desconecta Prisma, recién ahí sale. |

### `tests/` — tests de integración

| Archivo | Qué es |
|---|---|
| `setup.ts` | `setupFiles` de Vitest: levanta un Postgres descartable con Testcontainers y le corre las migraciones reales, antes de cada archivo de test. |
| `integration/auth.test.ts` | Cobertura de todo el módulo de autenticación (happy paths + 401 + 409 + rotación/reuso de refresh token). |
| `integration/persona.test.ts` | Cobertura del ABM de Persona (happy paths + 401/403/404/409). |

### `docker/` — Dockerfile y entrypoint

| Archivo | Qué es |
|---|---|
| `Dockerfile` | Build multi-stage (`deps` → `build` → `runtime`), con comentarios explicando el porqué de cada etapa. |
| `entrypoint.sh` | Lo que corre al arrancar el contenedor: migra, seedea, y recién ahí ejecuta el comando real (`node dist/server.js` en producción, `tsx watch` en desarrollo). |

### Archivos de configuración en la raíz

| Archivo | Qué es |
|---|---|
| `package.json` | Dependencias y scripts (ver [Scripts de package.json](#scripts-de-packagejson)). |
| `tsconfig.json` | Config de TypeScript, comentada (TS acepta comentarios en este archivo). |
| `eslint.config.js` | Config "flat" de ESLint 9. Tiene la regla `import/no-restricted-paths` que hace CUMPLIR en build-time la arquitectura en capas — no es solo una convención escrita. |
| `.prettierrc` | Config de formato. |
| `prisma.config.ts` | Le dice a la CLI de Prisma cómo conectarse (ver comentario del archivo para el porqué, específico de Prisma 7). |
| `vitest.config.ts` | Config de Vitest: conecta `tests/setup.ts` y ajusta timeouts para Testcontainers. |
| `docker-compose.yml` | Orquesta `db` + `api` en modo "producción-like". |
| `docker-compose.override.yml` | Se aplica automáticamente encima, en desarrollo: hot reload + Postgres expuesto al host. |
| `.env.example` | Todas las variables de entorno, documentadas una por una. |
| `.gitignore` / `.dockerignore` | Qué no versionar / qué no mandar al build de Docker. |

---

## Arquitectura: regla de dependencias entre capas

```
route → controller → service → repository → db
                 ↘ dto            ↘ model
service → client
service NO importa controller, route ni express
repository NO importa service
```

Esto no es solo una convención en un documento: `eslint.config.js` tiene la
regla `import/no-restricted-paths` configurada para hacerla cumplir —
`pnpm lint` falla si alguien la rompe. Ver el comentario de ese archivo
para el detalle de qué cruces exactos están prohibidos.

La idea detrás: cada capa solo conoce a la de abajo, nunca a la de arriba.
Un `service` no sabe que existe HTTP (por eso puede testearse sin
Express, y reusarse si algún día apareciera, por ejemplo, un consumer de
una cola de mensajes que necesite la misma lógica de negocio). Un
`repository` no sabe qué reglas de negocio hay alrededor de los datos que
trae — solo sabe traerlos.

---

## Modelo de datos

Tres modelos en `prisma/schema.prisma` (ver el archivo, tiene comentarios
en cada campo no obvio):

- **`User`**: usuarios de la API. `passwordHash` (argon2id, nunca texto
  plano), `rol` (`ADMIN`\|`USER`).
- **`RefreshToken`**: un refresh token emitido para un usuario. Solo se
  persiste `tokenHash` (SHA-256), nunca el token en texto plano.
  `revokedAt` es la clave de la rotación con detección de reuso (ver
  siguiente sección).
- **`Persona`**: el módulo de negocio de ejemplo. `dni` único, `activo`
  para la baja lógica.

Los tres usan `uuid(7)` como id — UUID v7 son ordenables por tiempo de
creación, mejor para el índice de la clave primaria que un UUID v4
puramente random.

---

## Flujo de autenticación

1. `POST /auth/register` crea un usuario (**siempre** `rol: USER` — no hay
   forma de auto-asignarse `ADMIN` vía API; el único ADMIN de esta semilla
   lo crea el seed).
2. `POST /auth/login` devuelve un `accessToken` (JWT HS256, TTL 15 min por
   default) y un `refreshToken` (32 bytes random en base64url, TTL 7 días
   por default). Del refresh token solo se persiste el hash SHA-256.
3. Cada request protegido manda `Authorization: Bearer <accessToken>`.
   `middleware/authenticate.ts` valida la firma y completa `req.user`.
4. Cuando el access token vence, `POST /auth/refresh` con el refresh token
   vigente devuelve un par nuevo y **revoca** el que se acaba de usar
   (rotación — nunca se reutiliza el mismo refresh token dos veces).
5. Si se reintenta usar un refresh token **ya revocado**, se interpreta
   como un indicio de robo de sesión: se revocan **todos** los refresh
   tokens del usuario y se responde 401 `REFRESH_TOKEN_REUTILIZADO`.
6. `POST /auth/logout` revoca el refresh token recibido.
7. `authorize('ADMIN')` (`middleware/authorize.ts`) es la factory de
   middleware para rutas que exigen un rol puntual — hoy, solo
   `DELETE /personas/:id`.

Todo el detalle criptográfico vive en `service/token.service.ts`; toda la
orquestación (qué hacer en cada caso) vive en `service/auth.service.ts`.

---

## Endpoints

Prefijo `/api/v1` salvo health y docs.

### Auth

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | — | Crea usuario. 409 si el email existe |
| POST | `/auth/login` | — | Devuelve access + refresh token |
| POST | `/auth/refresh` | — | Rota el refresh token. 401 si está revocado o vencido |
| POST | `/auth/logout` | Bearer | Revoca el refresh token recibido |
| GET | `/auth/me` | Bearer | Datos del usuario autenticado |

### Personas

| Método | Path | Auth | Descripción |
|---|---|---|---|
| GET | `/personas` | Bearer | Listado paginado. Query: `page`, `size`, `sort`, `q`, `activo` |
| GET | `/personas/:id` | Bearer | 404 si no existe |
| POST | `/personas` | Bearer | 409 si el DNI ya existe |
| PUT | `/personas/:id` | Bearer | Actualización total |
| PATCH | `/personas/:id` | Bearer | Actualización parcial |
| DELETE | `/personas/:id` | Bearer + ADMIN | Soft delete (`activo = false`) |

### Infraestructura

| Método | Path | Descripción |
|---|---|---|
| GET | `/health/live` | 200 seco, sin tocar la base |
| GET | `/health/ready` | Hace `SELECT 1`. 503 si la base no responde |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs.json` | Documento OpenAPI 3.1 |

---

## Formato de respuestas

### Error (único para toda la API, emitido solo por `error-handler.ts`)

```json
{
  "timestamp": "2026-09-09T14:32:11.204Z",
  "status": 409,
  "code": "PERSONA_DNI_DUPLICADO",
  "message": "Ya existe una persona con el DNI 30123456",
  "path": "/api/v1/personas",
  "requestId": "01J9X...",
  "details": []
}
```

`details` se llena solo en errores de validación (400), con
`{ field, message }` por cada issue que reportó zod.

Mapeo de origen → status code:

| Origen | Status |
|---|---|
| `AppException` y derivadas (`exception/*.ts`) | el que trae la excepción |
| `ZodError` (falló `middleware/validate.ts`) | 400, `VALIDATION_ERROR` |
| Prisma `P2002` (constraint UNIQUE) | 409, `RECURSO_DUPLICADO` |
| Prisma `P2025` (no encontrado) | 404, `RECURSO_NO_ENCONTRADO` |
| Cualquier otro error | 500, `INTERNAL_ERROR` (el stack va al log, nunca al cliente) |

### Paginado (cualquier listado)

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 137,
  "totalPages": 7,
  "first": true,
  "last": false
}
```

---

## Cómo agregar un módulo nuevo

Siguiendo el mismo patrón que `Persona`, para un módulo `Foo`:

1. **Modelo Prisma**: agregar `model Foo` en `prisma/schema.prisma` y
   correr `pnpm db:migrate`.
2. **`model/foo.model.ts`**: reexportar el tipo `Foo` generado por Prisma
   más los tipos propios que no vivan en la base (filtros, etc.).
3. **`repository/foo.repository.ts`**: fachada sobre `prisma.foo`. Es la
   única capa que puede importar `db/client.ts`.
4. **`dto/foo/*.ts`**: un archivo por DTO — schema de zod + tipo inferido
   (`z.infer`) + `.meta({ id: '...' })` para que aparezca en OpenAPI. Nunca
   separar la interface del validador. Si necesita PUT/PATCH, derivar esos
   dos del schema base con `.meta()`/`.partial()` (ver
   `dto/persona/update-persona.request.ts`).
5. **`service/foo.service.ts`**: la lógica de negocio. No importa
   `express` ni conoce `req`/`res`. Lanza `NotFoundException`,
   `ConflictException`, etc. de `exception/`.
6. **`mapper/foo.mapper.ts`**: entity → DTO de respuesta, filtrando
   campos sensibles si los hay.
7. **`controller/foo.controller.ts`**: llama al service y arma la
   respuesta HTTP. Sin lógica de negocio.
8. **`route/foo.routes.ts`**: declara las rutas con su cadena de
   middlewares (`validate`, `authenticate`, `authorize` según haga falta)
   y las registra en `route/index.ts`.
9. **`config/openapi.ts`**: registrar los schemas y paths nuevos — el
   documento se arma a partir de los mismos schemas de `dto/`, nunca a
   mano en un YAML aparte.
10. **Tests**: agregar `tests/integration/foo.test.ts` cubriendo el happy
    path y los casos 401/403/404/409 que apliquen (ver
    `tests/integration/persona.test.ts` como plantilla).

---

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Resumen:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto HTTP de la API | `3000` |
| `LOG_LEVEL` | Nivel de log de pino | `debug` |
| `DATABASE_URL` | Connection string de Postgres | `postgresql://seed:seed@db:5432/seed_db?schema=public` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales con las que arranca el contenedor de Postgres (deben coincidir con `DATABASE_URL`) | `seed` / `seed` / `seed_db` |
| `JWT_SECRET` | Secreto HS256, mínimo 32 caracteres | — |
| `JWT_ACCESS_TTL` | TTL del access token | `15m` |
| `JWT_REFRESH_TTL` | TTL del refresh token | `7d` |
| `CORS_ORIGIN` | Origen(es) permitidos por CORS (separados por coma) | `http://localhost:5173` |

`src/config/env.ts` valida todas estas variables con zod al arrancar el
proceso — si falta una, el servidor no levanta y explica por consola cuál
es el problema.

---

## Scripts de `package.json`

| Script | Qué hace |
|---|---|
| `pnpm dev` | `tsx watch src/server.ts` — levanta el server con recarga automática al guardar. |
| `pnpm build` | `prisma generate && tsc` — regenera el cliente de Prisma y compila a `dist/`. |
| `pnpm start` | `node dist/server.js` — corre el build ya compilado (lo que usa el Dockerfile en producción). |
| `pnpm db:migrate` | `prisma migrate dev` — crea/aplica una migración en desarrollo (te pide un nombre si hay cambios en el schema). |
| `pnpm db:deploy` | `prisma migrate deploy` — aplica migraciones ya existentes sin generar nuevas (lo que corre `docker/entrypoint.sh` en cada arranque). |
| `pnpm db:seed` | `tsx prisma/seed.ts` — corre el seed a mano. |
| `pnpm db:studio` | `prisma studio` — UI web para inspeccionar/editar datos. |
| `pnpm test` | `vitest run` — corre los tests de integración una vez. |
| `pnpm test:watch` | `vitest` — los corre en modo watch. |
| `pnpm lint` | `eslint .` — incluye la regla que hace cumplir la arquitectura en capas. |
| `pnpm format` | `prettier --write .` |

---

## Docker, explicado archivo por archivo

- **`docker/Dockerfile`**: 3 etapas.
  1. `deps` — instala dependencias (`pnpm install --frozen-lockfile`) en
     una capa que Docker cachea mientras no cambie el lockfile.
  2. `build` — copia el código, genera el cliente de Prisma, compila
     TypeScript.
  3. `runtime` — imagen final, corre como usuario no root. Conserva
     `node_modules` completo (no solo producción) porque el entrypoint
     necesita `prisma` y `tsx` (devDependencies) para migrar y seedear al
     arrancar — es una excepción documentada a propósito en el propio
     Dockerfile.
- **`docker/entrypoint.sh`**: migra → seedea → recién ahí ejecuta el
  comando real del contenedor.
- **`docker-compose.yml`**: define `db` (Postgres con healthcheck) y `api`
  (build del Dockerfile, espera a que `db` esté sano antes de arrancar).
  Es el modo "producción-like" (usa la etapa `runtime`).
- **`docker-compose.override.yml`**: Docker Compose lo aplica
  automáticamente encima del anterior en `docker compose up` (sin flags).
  Cambia la etapa a `build` (con devDependencies), pisa el comando por
  `tsx watch`, monta el código como volumen, y expone Postgres en el
  puerto 5432 del host. Para forzar el modo sin override:
  `docker compose -f docker-compose.yml up --build`.

---

## Tests

```bash
pnpm test
```

Vitest + Supertest, contra la app real (`createApp()` de `src/app.ts`, que
nunca llama a `.listen(...)`). `tests/setup.ts` levanta un Postgres
descartable con **Testcontainers** por cada archivo de test y le corre las
migraciones reales — **no se mockea Prisma**.

Cobertura actual (17 tests): el happy path de cada endpoint más los casos
401, 403, 404 y 409 relevantes, incluyendo la rotación de refresh token y
la detección de reuso.

---

## Convenciones de código

- **Archivos**: `kebab-case`.
- **Clases y tipos**: `PascalCase`.
- **Funciones y variables**: `camelCase`.
- **Constantes de módulo**: `UPPER_SNAKE_CASE`.
- **Campos del dominio en español** (`nombre`, `apellido`,
  `fechaNacimiento`); **los técnicos en inglés** (`createdAt`,
  `passwordHash`).
- **Sin contenedor de DI**: cada `service`/`repository` se exporta como un
  objeto singleton (`export const xService = { ... }`), importado directo
  donde haga falta. No hay decoradores ni `tsyringe`.
- **Sin `try/catch` manual en controllers**: Express 5 propaga los errores
  de handlers `async` solo — no hace falta `express-async-errors`.

---

## Fuera de alcance

No incluidos en esta versión (con comentarios `// TODO` en el código donde
correspondería engancharlos): rate limiting, envío de mails, upload de
archivos, cache con Redis, websockets, CI en GitHub Actions,
multi-tenancy.

---

## Troubleshooting

- **`docker compose up` falla en el paso de `pnpm install --frozen-lockfile`
  por una política de "supply-chain" / `minimumReleaseAge`**: asegurate de
  que la versión de pnpm que resuelve `corepack` adentro del contenedor
  sea la misma que generó el `pnpm-lock.yaml` — `package.json` fija
  `"packageManager": "pnpm@<versión>"` justamente para esto. Si se
  actualizan las dependencias, conviene correr `pnpm install` en local con
  esa misma versión antes de buildear la imagen.
- **`GET /health/ready` devuelve 503**: la API no puede pegarle a
  Postgres. Revisar que `DATABASE_URL` apunte al host/puerto correctos
  (`db` como host si estás en Docker, `localhost` si corrés la API
  suelta) y que el contenedor de `db` esté `healthy`
  (`docker compose ps`).
- **Los tests no arrancan / se cuelgan levantando el contenedor**:
  Testcontainers necesita Docker corriendo en la máquina donde se ejecuta
  `pnpm test` (local o CI).
- **`grep -r "@prisma/client" src/` no debería devolver nada** (fuera de
  `src/db/generated/`, que es autogenerado y sí lo referencia
  internamente): todo el código propio importa el cliente desde
  `src/db/client.ts`, nunca desde `@prisma/client` directo. Es un buen
  chequeo rápido de que no se rompió la convención de Prisma 7.
