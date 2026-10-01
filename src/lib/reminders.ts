import type { DayString } from '@/lib/dates'

/**
 * Cuándo se puede recordar una solicitud (M1, M3, M4, M6, M7).
 *
 * Es la misma regla para el trabajo diario y para el botón del asesor, con una diferencia: el trabajo
 * diario solo mira lo vencido y manda **un** recordatorio por solicitud (M3); el asesor puede insistir,
 * pero no antes de 24 horas (M7).
 */

/** M7 · Entre dos recordatorios de la misma solicitud, al menos un día. */
export const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000

export type ReminderRequest = {
  status: 'pending' | 'fulfilled' | 'cancelled'
  dueDate: DayString
  reminderSentAt: Date | null
}

export type ReminderCheck =
  | { ok: true }
  | {
      ok: false
      reason: 'not-pending' | 'not-due' | 'already-sent' | 'too-soon'
      retryAt?: Date
    }

export function canSendReminder(
  request: ReminderRequest,
  { now, today, automatic }: { now: Date; today: DayString; automatic: boolean },
): ReminderCheck {
  // M4 · De una cumplida o cancelada no se recuerda nada.
  if (request.status !== 'pending') return { ok: false, reason: 'not-pending' }

  if (automatic) {
    // M1 · Solo lo que ya ha llegado a su fecha límite o la ha pasado.
    if (request.dueDate > today) return { ok: false, reason: 'not-due' }
    // M3 · Y una sola vez: insistir es decisión del asesor.
    if (request.reminderSentAt) return { ok: false, reason: 'already-sent' }

    return { ok: true }
  }

  // M7 · A mano se puede insistir, pero no antes de 24 horas.
  if (request.reminderSentAt) {
    const cuando = new Date(request.reminderSentAt.getTime() + REMINDER_COOLDOWN_MS)
    if (cuando > now) return { ok: false, reason: 'too-soon', retryAt: cuando }
  }

  return { ok: true }
}

export type ReminderDelivery = { sent: number; failed: number }

/**
 * M8 · Manda el recordatorio a cada usuario de la empresa sin pararse porque falle uno.
 *
 * El envío de verdad entra por parámetro: así esto se prueba sin correo, y quien lo llama decide con el
 * resultado si la solicitud se da por recordada (cuando ha salido para alguien) o no.
 */
export async function deliverReminder(
  recipients: string[],
  send: (recipient: string) => Promise<void>,
): Promise<ReminderDelivery> {
  const resultado: ReminderDelivery = { sent: 0, failed: 0 }

  for (const recipient of recipients) {
    try {
      await send(recipient)
      resultado.sent += 1
    } catch {
      // El motivo ya lo deja apuntado quien envía, sin datos de nadie. Aquí solo se cuenta.
      resultado.failed += 1
    }
  }

  return resultado
}
