/**
 * Lo que devuelve un cambio en los datos.
 *
 * Los errores que se esperan (un NIF repetido, algo que ya no está) vuelven así, para poder explicárselos
 * a la persona. Los inesperados se lanzan y los recoge `error.tsx` (docs/conventions.md).
 */
export type SaveResult = { ok: true } | { ok: false; message: string }
