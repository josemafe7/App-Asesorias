import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { DossierInput } from '@/lib/validation/dossiers'

import type { SaveResult } from './result'

/**
 * Los expedientes trimestrales (E1-E5).
 *
 * Como en el resto de `src/data/`, aquí no se decide quién ve qué: lo hacen las políticas de la base de
 * datos. El asesor solo recibe los de sus clientes y el usuario cliente solo los de su empresa.
 */

export type DossierStatus = 'open' | 'closed'

export type Dossier = {
  id: string
  clientId: string
  year: number
  quarter: number
  status: DossierStatus
}

const DOSSIER_COLUMNS = 'id, client_id, year, quarter, status'

type DossierRow = {
  id: string
  client_id: string
  year: number
  quarter: number
  status: DossierStatus
}

function toDossier(row: DossierRow): Dossier {
  return {
    id: row.id,
    clientId: row.client_id,
    year: row.year,
    quarter: row.quarter,
    status: row.status,
  }
}

/** Los expedientes de una empresa, del más reciente al más antiguo. */
export async function listDossiers(clientId: string): Promise<Dossier[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dossiers')
    .select(DOSSIER_COLUMNS)
    .eq('client_id', clientId)
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })

  if (error) throw new Error(`No se han podido leer los expedientes: ${error.message}`)

  return (data ?? []).map(toDossier)
}

export async function getDossier(id: string): Promise<Dossier | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dossiers')
    .select(DOSSIER_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return toDossier(data)
}

/** E2 · El trimestre repetido lo rechaza la base de datos; aquí se traduce a algo que se entienda. */
const DUPLICATE_QUARTER = '23505'

export async function insertDossier(
  input: DossierInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dossiers')
    .insert({ client_id: input.clientId, year: input.year, quarter: input.quarter })
    .select('id')
    .single()

  if (error?.code === DUPLICATE_QUARTER) {
    return { ok: false, message: 'Ese trimestre ya está abierto para este cliente.' }
  }
  if (error || !data) {
    return { ok: false, message: 'No se ha podido abrir el expediente. Inténtalo otra vez.' }
  }

  return { ok: true, id: data.id }
}

/** E3 · Cerrar un expediente y volver a abrirlo. */
export async function setDossierStatus(id: string, status: DossierStatus): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('dossiers').update({ status }).eq('id', id)

  if (error) return { ok: false, message: 'No se ha podido cambiar el expediente.' }

  return { ok: true }
}
