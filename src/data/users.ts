import 'server-only'

import type { Role } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

import type { SaveResult } from './result'

/**
 * Los usuarios del portal: quién es cada uno, qué rol tiene y a qué empresa pertenece.
 *
 * El rol vive en esta tabla, protegida por políticas, y nunca en los datos que el propio usuario puede
 * cambiar desde el navegador (docs/architecture.md). Crear la cuenta en sí no se hace aquí: eso necesita
 * la clave secreta y está en la acción que invita (A5).
 */

export type User = {
  id: string
  fullName: string
  email: string
  role: Role
  clientId: string | null
  isActive: boolean
}

export type UserFilters = {
  role?: Role
  status?: 'all' | 'active' | 'inactive'
  clientId?: string
}

const USER_COLUMNS = 'id, full_name, email, role, client_id, is_active'

type UserRow = {
  id: string
  full_name: string
  email: string
  role: Role
  client_id: string | null
  is_active: boolean
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    clientId: row.client_id,
    isActive: row.is_active,
  }
}

export async function listUsers(filters: UserFilters = {}): Promise<User[]> {
  const supabase = await createClient()

  let query = supabase.from('profiles').select(USER_COLUMNS).order('full_name')

  if (filters.role) query = query.eq('role', filters.role)
  if (filters.clientId) query = query.eq('client_id', filters.clientId)
  if (filters.status === 'active') query = query.eq('is_active', true)
  if (filters.status === 'inactive') query = query.eq('is_active', false)

  const { data, error } = await query
  if (error) throw new Error(`No se han podido leer los usuarios: ${error.message}`)

  return (data ?? []).map(toUser)
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(USER_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return toUser(data)
}

/** Para no invitar dos veces a la misma persona. */
export async function findUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(USER_COLUMNS)
    .eq('email', email)
    .maybeSingle()

  if (error || !data) return null

  return toUser(data)
}

/** El perfil del usuario recién invitado. La cuenta ya existe; esto dice quién es y qué puede hacer. */
export async function insertProfile(user: {
  id: string
  email: string
  fullName: string
  role: Role
  clientId: string | null
}): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    client_id: user.clientId,
  })

  if (error) return { ok: false, message: `No se ha podido crear el perfil: ${error.message}` }

  return { ok: true }
}

export async function setUserActive(id: string, isActive: boolean): Promise<SaveResult> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('profiles')
    .update({ is_active: isActive }, { count: 'exact' })
    .eq('id', id)

  if (error) throw new Error(`No se ha podido cambiar el estado del usuario: ${error.message}`)
  if (count === 0) return { ok: false, message: 'Ese usuario ya no está.' }

  return { ok: true }
}

/** C7 · Al cambiar de rol, la empresa va con él: un cliente la tiene y los demás roles, no. */
export async function setUserRole(
  id: string,
  role: Role,
  clientId: string | null,
): Promise<SaveResult> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('profiles')
    .update({ role, client_id: clientId }, { count: 'exact' })
    .eq('id', id)

  if (error) throw new Error(`No se ha podido cambiar el rol: ${error.message}`)
  if (count === 0) return { ok: false, message: 'Ese usuario ya no está.' }

  return { ok: true }
}
