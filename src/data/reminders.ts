import 'server-only'

import type { DayString } from '@/lib/dates'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Lo que hace falta para recordar una solicitud (M1-M7).
 *
 * El trabajo diario no lo ejecuta ninguna persona: lo llama un trabajo programado con su secreto, así
 * que ahí no hay sesión de nadie y la consulta va con la clave secreta. Lo que manda el asesor a mano
 * sí va con su sesión, y por tanto por sus políticas.
 */

export type ReminderTarget = {
  requestId: string
  title: string
  dueDate: DayString
  reminderSentAt: Date | null
  emails: string[]
}

/** M1 · Las solicitudes pendientes cuya fecha límite ya ha llegado o ha pasado. */
export async function listRequestsForDailyReminder(today: DayString): Promise<ReminderTarget[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('document_requests')
    .select('id, title, due_date, reminder_sent_at, dossiers!inner(client_id)')
    .eq('status', 'pending')
    .lte('due_date', today)
    .order('due_date')

  if (error) throw new Error(`No se han podido leer las solicitudes: ${error.message}`)

  const filas = data ?? []
  const empresas = [...new Set(filas.map((fila) => fila.dossiers.client_id))]
  if (empresas.length === 0) return []

  // M2 · El correo va a los usuarios de esa empresa cliente. Los desactivados no reciben nada.
  const { data: usuarios, error: usuariosError } = await admin
    .from('profiles')
    .select('email, client_id')
    .eq('role', 'client')
    .eq('is_active', true)
    .in('client_id', empresas)

  if (usuariosError) {
    throw new Error(`No se han podido leer los destinatarios: ${usuariosError.message}`)
  }

  const correosPorEmpresa = new Map<string, string[]>()
  for (const usuario of usuarios ?? []) {
    if (!usuario.client_id) continue
    correosPorEmpresa.set(usuario.client_id, [
      ...(correosPorEmpresa.get(usuario.client_id) ?? []),
      usuario.email,
    ])
  }

  return filas.map((fila) => ({
    requestId: fila.id,
    title: fila.title,
    dueDate: fila.due_date,
    reminderSentAt: fila.reminder_sent_at ? new Date(fila.reminder_sent_at) : null,
    emails: correosPorEmpresa.get(fila.dossiers.client_id) ?? [],
  }))
}

/** M3 · Se apunta la fecha del envío para no volver a mandarlo solo. */
export async function markReminderSentByJob(requestId: string): Promise<void> {
  const admin = createAdminClient()

  await admin
    .from('document_requests')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', requestId)
}

/** M6 · Lo mismo, cuando lo manda el asesor: con su sesión, así que pasa por sus políticas. */
export async function markReminderSent(requestId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('document_requests')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', requestId)
}

/** Los correos de los usuarios activos de una empresa, para mandarles el recordatorio. */
export async function clientUserEmails(clientId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'client')
    .eq('client_id', clientId)
    .eq('is_active', true)

  if (error) throw new Error(`No se han podido leer los destinatarios: ${error.message}`)

  return (data ?? []).map((fila) => fila.email)
}
