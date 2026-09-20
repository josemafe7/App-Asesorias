import 'server-only'

import { z } from 'zod'

import { ROLES, type Role } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

// Lo que devuelve la base de datos también se valida. Si un día cambia una columna, salta aquí y no
// tres pantallas más allá con un `undefined` por el medio.
const profileRowSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  full_name: z.string(),
  role: z.enum(ROLES),
  client_id: z.uuid().nullable(),
  is_active: z.boolean(),
})

export type CurrentProfile = {
  id: string
  email: string
  fullName: string
  role: Role
  clientId: string | null
}

/**
 * Quién está usando la app ahora mismo, o `null` si no hay nadie.
 *
 * Se apoya en `getClaims()`, que verifica la firma del token, y nunca en `getSession()`, que se limita a
 * leer la cookie y se puede falsificar (docs/security.md · «Usuarios y permisos»).
 *
 * A4 · Un usuario desactivado cuenta como «no hay nadie», aunque su contraseña sea correcta.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, client_id, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null

  const parsed = profileRowSchema.safeParse(data)
  if (!parsed.success || !parsed.data.is_active) return null

  return {
    id: parsed.data.id,
    email: parsed.data.email,
    fullName: parsed.data.full_name,
    role: parsed.data.role,
    clientId: parsed.data.client_id,
  }
}
