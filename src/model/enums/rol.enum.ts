/**
 * model/enums/rol.enum.ts
 * ---------------------------------------------------------------------
 * Reexporta el enum `Rol` (`ADMIN` | `USER`) que Prisma genera a partir de
 * `enum Rol { ... }` en prisma/schema.prisma. Es el único archivo de
 * `model/` que expone un *valor* en runtime (los demás archivos de esta
 * carpeta son solo tipos) — porque un enum de Prisma también es un objeto
 * real en JS (`Rol.ADMIN`, `Rol.USER`), no solo un tipo.
 *
 * Por qué reexportarlo en vez de importar directo desde
 * `db/generated/client.js` en cada lugar que lo necesita: así, si el día
 * de mañana el enum dejara de venir de Prisma (por ejemplo, se separa en
 * su propia tabla), solo hay que tocar este archivo — todo lo demás
 * (`middleware/authorize.ts`, `route/persona.routes.ts`, etc.) sigue
 * importando `Rol` desde acá sin cambios.
 */
import { Rol } from '../../db/generated/client.js';

export { Rol };
