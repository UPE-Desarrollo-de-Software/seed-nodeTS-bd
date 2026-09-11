/**
 * util/pagination.util.ts
 * ---------------------------------------------------------------------
 * Helpers puros (sin estado, sin I/O — la regla de la carpeta `util/`)
 * para paginación y orden. Los usa `service/persona.service.ts`, pero
 * están acá y no ahí porque son genéricos: cualquier módulo nuevo con
 * listado paginado (ver "Cómo agregar un módulo nuevo" en el README) los
 * puede reusar tal cual, sin copiar/pegar la lógica de paginación.
 *
 *   - `toSkipTake`: pasa de `{page, size}` (0-indexado, como lo pide la
 *     API) a `{skip, take}` (lo que espera Prisma).
 *   - `buildPage`: arma el sobre de paginación de la respuesta —
 *     `{ content, page, size, totalElements, totalPages, first, last }—
 *     el mismo formato para cualquier listado de la API (ver la sección
 *     "Formato de respuesta paginada" del README).
 *   - `parseSort`: convierte un query param `sort=campo,asc|desc` en el
 *     `orderBy` de Prisma, validando el campo contra una whitelist
 *     (`allowedFields`) para no dejar que alguien mande `sort=passwordHash`
 *     y intente ordenar por un campo que no debería ser accesible así.
 */
export interface PageRequest {
  page: number;
  size: number;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export function toSkipTake({ page, size }: PageRequest): { skip: number; take: number } {
  return { skip: page * size, take: size };
}

export function buildPage<T>(content: T[], totalElements: number, { page, size }: PageRequest): Page<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1 || totalPages === 0,
  };
}

/**
 * Convierte un string tipo "apellido,asc" o "createdAt,desc" en un orderBy de
 * Prisma. Si el campo no es válido, cae en el default provisto.
 */
export function parseSort(
  sort: string | undefined,
  allowedFields: readonly string[],
  defaultField: string,
): Record<string, 'asc' | 'desc'> {
  if (!sort) {
    return { [defaultField]: 'asc' };
  }
  const [field, direction] = sort.split(',');
  const safeField = field && allowedFields.includes(field) ? field : defaultField;
  const safeDirection = direction === 'desc' ? 'desc' : 'asc';
  return { [safeField]: safeDirection };
}
