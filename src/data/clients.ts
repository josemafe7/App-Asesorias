import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ClientInput } from '@/lib/validation/clients'

import type { SaveResult } from './result'

/**
 * Los clientes de la asesoría: las empresas y los autónomos.
 *
 * Aquí no se decide quién ve qué: eso lo hacen las políticas de la base de datos. El administrador ve
 * todos, el asesor solo los suyos (C4) y un usuario cliente solo su empresa. Lo que devuelve cada
 * consulta ya viene filtrado por ellas.
 */

export type Client = {
  id: string
  legalName: string
  taxId: string
  email: string | null
  phone: string | null
  advisorId: string | null
  isActive: boolean
}

export type Advisor = { id: string; fullName: string; email: string }

export type ClientFilters = { advisorId?: string; status?: 'all' | 'active' | 'inactive' }

const CLIENT_COLUMNS = 'id, legal_name, tax_id, email, phone, advisor_id, is_active'

type ClientRow = {
  id: string
  legal_name: string
  tax_id: string
  email: string | null
  phone: string | null
  advisor_id: string | null
  is_active: boolean
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    legalName: row.legal_name,
    taxId: row.tax_id,
    email: row.email,
    phone: row.phone,
    advisorId: row.advisor_id,
    isActive: row.is_active,
  }
}

export async function listClients(filters: ClientFilters = {}): Promise<Client[]> {
  const supabase = await createClient()

  let query = supabase.from('clients').select(CLIENT_COLUMNS).order('legal_name')

  if (filters.advisorId) query = query.eq('advisor_id', filters.advisorId)
  if (filters.status === 'active') query = query.eq('is_active', true)
  if (filters.status === 'inactive') query = query.eq('is_active', false)

  const { data, error } = await query
  if (error) throw new Error(`No se han podido leer los clientes: ${error.message}`)

  return (data ?? []).map(toClient)
}

/** Devuelve `null` cuando no existe y también cuando existe pero quien pregunta no puede verlo. */
export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(CLIENT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return toClient(data)
}

/** Los asesores a los que se puede asignar un cliente (C3). Solo los da el administrador. */
export async function listAdvisors(): Promise<Advisor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'advisor')
    .eq('is_active', true)
    .order('full_name')

  if (error) throw new Error(`No se han podido leer los asesores: ${error.message}`)

  return (data ?? []).map((row) => ({ id: row.id, fullName: row.full_name, email: row.email }))
}

/**
 * Cuántas empresas lleva un asesor (C9).
 *
 * Antes de desactivarlo o de cambiarle el rol hay que reasignarlas: si no, la empresa se queda con un
 * asesor que ya no la lleva y las pantallas dejan de decir la verdad.
 */
export async function countClientsByAdvisor(advisorId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('advisor_id', advisorId)

  if (error) throw new Error(`No se han podido contar los clientes del asesor: ${error.message}`)

  return count ?? 0
}

/**
 * El asesor asignado a una empresa. Un usuario cliente puede leer el suyo, y solo el suyo, para
 * escribirle (A10).
 */
export async function getAdvisor(advisorId: string): Promise<Advisor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', advisorId)
    .maybeSingle()

  if (error || !data) return null

  return { id: data.id, fullName: data.full_name, email: data.email }
}

/** C2 · El NIF repetido lo rechaza la base de datos; aquí se traduce a algo que se entienda. */
const DUPLICATE_TAX_ID = '23505'

export async function insertClient(
  input: ClientInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      legal_name: input.legalName,
      tax_id: input.taxId,
      email: input.email,
      phone: input.phone,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === DUPLICATE_TAX_ID) {
      return { ok: false, message: 'Ya hay un cliente dado de alta con ese NIF.' }
    }
    throw new Error(`No se ha podido dar de alta el cliente: ${error.message}`)
  }

  return { ok: true, id: data.id }
}

export async function updateClient(id: string, input: ClientInput): Promise<SaveResult> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('clients')
    .update(
      {
        legal_name: input.legalName,
        tax_id: input.taxId,
        email: input.email,
        phone: input.phone,
      },
      { count: 'exact' },
    )
    .eq('id', id)

  if (error) {
    if (error.code === DUPLICATE_TAX_ID) {
      return { ok: false, message: 'Ya hay otro cliente dado de alta con ese NIF.' }
    }
    throw new Error(`No se han podido guardar los datos del cliente: ${error.message}`)
  }

  if (count === 0) return { ok: false, message: 'Ese cliente ya no está.' }

  return { ok: true }
}

/** C3 y C5 · Asignar o reasignar. `null` deja el cliente sin asesor. */
export async function setClientAdvisor(id: string, advisorId: string | null): Promise<SaveResult> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('clients')
    .update({ advisor_id: advisorId }, { count: 'exact' })
    .eq('id', id)

  if (error) throw new Error(`No se ha podido cambiar el asesor: ${error.message}`)
  if (count === 0) return { ok: false, message: 'Ese cliente ya no está.' }

  return { ok: true }
}

/** C6 · Desactivar no borra nada: el cliente deja de aparecer en las listas de trabajo. */
export async function setClientActive(id: string, isActive: boolean): Promise<SaveResult> {
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('clients')
    .update({ is_active: isActive }, { count: 'exact' })
    .eq('id', id)

  if (error) throw new Error(`No se ha podido cambiar el estado del cliente: ${error.message}`)
  if (count === 0) return { ok: false, message: 'Ese cliente ya no está.' }

  return { ok: true }
}
