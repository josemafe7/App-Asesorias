import 'server-only'

import { redirect } from 'next/navigation'

import { getCurrentProfile, type CurrentProfile, type Role } from '@/data/profile'

/**
 * El portero de cada página privada.
 *
 * Se llama al principio de toda página, Server Action y Route Handler que no sea pública. El proxy de
 * Next.js no sustituye a esto: se puede esquivar, y además no sabe de roles.
 *
 * A1 · Sin sesión, a la pantalla de acceso.
 */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/acceso')
  return profile
}

/**
 * Como `requireProfile`, pero además exige uno de los roles indicados.
 *
 * A7 · Quien abre una dirección que no le corresponde ve «no tienes permiso», no el contenido.
 */
export async function requireRole(...roles: Role[]): Promise<CurrentProfile> {
  const profile = await requireProfile()
  if (!roles.includes(profile.role)) redirect('/sin-permiso')
  return profile
}
