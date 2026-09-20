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
