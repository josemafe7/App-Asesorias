/**
 * Los tres roles de la app y cómo se llaman en las pantallas.
 *
 * Vive aquí, y no en `src/data/profile.ts`, porque lo necesitan sitios que no tocan la base de datos:
 * las validaciones de los formularios y sus pruebas. `src/data/` es solo para servidor y arrastra
 * consigo el cliente de Supabase.
 */

export const ROLES = ['admin', 'advisor', 'client'] as const
export type Role = (typeof ROLES)[number]

/** El código va en inglés; lo que ve la gente, en español. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  advisor: 'Asesor',
  client: 'Cliente',
}

/** A3 · Dónde aterriza cada rol al entrar. */
export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  advisor: '/asesor',
  client: '/cliente',
}
