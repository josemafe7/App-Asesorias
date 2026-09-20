import 'server-only'

import type { DayString } from '@/lib/dates'
import { createClient } from '@/lib/supabase/server'
import type { RequestInput } from '@/lib/validation/requests'

import type { SaveResult } from './result'

/**
 * Las solicitudes de documentación de cada expediente (S1-S6).
 *
 * Quién puede verlas y tocarlas lo deciden las políticas de la base de datos, no este archivo.
 */

export type RequestStatus = 'pending' | 'fulfilled' | 'cancelled'

export type DocumentRequest = {
  id: string
  dossierId: string
  title: string
  description: string | null
  dueDate: DayString
  status: RequestStatus
  reminderSentAt: string | null
}

/** Una solicitud del panel del cliente, que además dice de qué trimestre es. */
export type ClientRequest = DocumentRequest & { year: number; quarter: number }

const REQUEST_COLUMNS = 'id, dossier_id, title, description, due_date, status, reminder_sent_at'

type RequestRow = {
  id: string
  dossier_id: string
  title: string
  description: string | null
  due_date: string
  status: RequestStatus
  reminder_sent_at: string | null
}

function toRequest(row: RequestRow): DocumentRequest {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    reminderSentAt: row.reminder_sent_at,
  }
}

/** Las solicitudes de un expediente, por fecha límite: lo que antes vence, antes se ve. */
export async function listRequests(dossierId: string): Promise<DocumentRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select(REQUEST_COLUMNS)
    .eq('dossier_id', dossierId)
    .order('due_date', { ascending: true })

  if (error) throw new Error(`No se han podido leer las solicitudes: ${error.message}`)

  return (data ?? []).map(toRequest)
}

/** Cuántas solicitudes pendientes tiene cada expediente de la lista (E5). */
export async function countPendingByDossier(
  dossierIds: string[],
): Promise<Map<string, number>> {
  const cuenta = new Map<string, number>()
  if (dossierIds.length === 0) return cuenta

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select('dossier_id')
    .in('dossier_id', dossierIds)
    .eq('status', 'pending')

  if (error) throw new Error(`No se han podido contar las solicitudes: ${error.message}`)

  for (const row of data ?? []) {
    cuenta.set(row.dossier_id, (cuenta.get(row.dossier_id) ?? 0) + 1)
  }

  return cuenta
}

/**
 * S6 · Las solicitudes pendientes de la empresa del usuario, por fecha límite.
 *
 * No hace falta filtrar por empresa: las políticas solo devuelven las suyas.
 */
export async function listPendingRequestsForClient(): Promise<ClientRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select(`${REQUEST_COLUMNS}, dossiers!inner(year, quarter)`)
    .eq('status', 'pending')
    .order('due_date', { ascending: true })

  if (error) throw new Error(`No se han podido leer las solicitudes: ${error.message}`)

  return (data ?? []).map((row) => ({
    ...toRequest(row),
    year: row.dossiers.year,
    quarter: row.dossiers.quarter,
  }))
}

export async function getRequest(id: string): Promise<DocumentRequest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select(REQUEST_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return toRequest(data)
}

export async function insertRequest(input: RequestInput): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('document_requests').insert({
    dossier_id: input.dossierId,
    title: input.title,
    description: input.description,
    due_date: input.dueDate,
  })

  if (error) return { ok: false, message: 'No se ha podido crear la solicitud. Inténtalo otra vez.' }

  return { ok: true }
}

/** S5 · Cancelar una solicitud: deja de reclamarse. */
export async function cancelRequest(id: string): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('document_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { ok: false, message: 'No se ha podido cancelar la solicitud.' }

  return { ok: true }
}
