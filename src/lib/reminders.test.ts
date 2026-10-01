import { describe, expect, it } from 'vitest'

import { canSendReminder, deliverReminder, REMINDER_COOLDOWN_MS } from './reminders'

/**
 * A quién le toca un recordatorio y cuándo (M1, M3, M4, M6, M7).
 *
 * Todo entra por parámetro (el momento y el día de hoy) para que la prueba no dependa de cuándo se
 * ejecute.
 */

const HOY = '2026-03-10'
const AHORA = new Date('2026-03-10T09:00:00Z')

function solicitud(cambios: Partial<Parameters<typeof canSendReminder>[0]> = {}) {
  return {
    status: 'pending' as const,
    dueDate: '2026-03-09',
    reminderSentAt: null,
    ...cambios,
  }
}

describe('canSendReminder · el trabajo diario (M1, M3, M4)', () => {
  const automatico = { now: AHORA, today: HOY, automatic: true }

  it('M1 · manda recordatorio de lo vencido y de lo que vence hoy', () => {
    expect(canSendReminder(solicitud(), automatico).ok).toBe(true)
    expect(canSendReminder(solicitud({ dueDate: HOY }), automatico).ok).toBe(true)
  })

  it('M1 · no manda nada de lo que todavía no ha vencido', () => {
    const resultado = canSendReminder(solicitud({ dueDate: '2026-03-20' }), automatico)

    expect(resultado).toEqual({ ok: false, reason: 'not-due' })
  })

  it('M4 · no manda recordatorio de una solicitud cumplida ni de una cancelada', () => {
    expect(canSendReminder(solicitud({ status: 'fulfilled' }), automatico).ok).toBe(false)
    expect(canSendReminder(solicitud({ status: 'cancelled' }), automatico).ok).toBe(false)
  })

  it('M3 · solo uno por solicitud: si ya salió, no vuelve a salir solo', () => {
    const resultado = canSendReminder(
      solicitud({ reminderSentAt: new Date('2026-03-01T09:00:00Z') }),
      automatico,
    )

    expect(resultado).toEqual({ ok: false, reason: 'already-sent' })
  })
})

describe('canSendReminder · el que manda el asesor a mano (M6, M7)', () => {
  const aMano = { now: AHORA, today: HOY, automatic: false }

  it('M6 · puede mandarlo aunque no haya vencido', () => {
    expect(canSendReminder(solicitud({ dueDate: '2026-03-20' }), aMano).ok).toBe(true)
  })

  it('M4 · pero no de una cumplida', () => {
    expect(canSendReminder(solicitud({ status: 'fulfilled' }), aMano).ok).toBe(false)
  })

  it('M7 · entre dos recordatorios tienen que pasar 24 horas, y dice cuándo se podrá', () => {
    const enviado = new Date('2026-03-10T07:00:00Z')
    const resultado = canSendReminder(solicitud({ reminderSentAt: enviado }), aMano)

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.reason).toBe('too-soon')
      expect(resultado.retryAt?.getTime()).toBe(enviado.getTime() + REMINDER_COOLDOWN_MS)
    }
  })

  it('M7 · pasadas las 24 horas, se puede volver a mandar', () => {
    const enviado = new Date(AHORA.getTime() - REMINDER_COOLDOWN_MS - 1000)

    expect(canSendReminder(solicitud({ reminderSentAt: enviado }), aMano).ok).toBe(true)
  })
})

describe('deliverReminder · cuando un correo no sale (M8)', () => {
  const PABLO = 'pablo@laespiga.es'
  const ROSA = 'rosa@laespiga.es'

  /** Un envío de mentira que falla con las direcciones que se le digan y apunta a quién lo ha intentado. */
  function envio(fallan: string[] = []) {
    const intentados: string[] = []

    return {
      intentados,
      send: async (destinatario: string) => {
        intentados.push(destinatario)
        if (fallan.includes(destinatario)) throw new Error('No se ha podido enviar el correo.')
      },
    }
  }

  it('si todos salen, los cuenta todos', async () => {
    const { send } = envio()

    expect(await deliverReminder([PABLO, ROSA], send)).toEqual({ sent: 2, failed: 0 })
  })

  it('si uno falla, sigue con los demás en vez de pararse', async () => {
    const { send, intentados } = envio([PABLO])

    const resultado = await deliverReminder([PABLO, ROSA], send)

    expect(resultado).toEqual({ sent: 1, failed: 1 })
    // El fallo del primero no ha impedido intentarlo con la segunda.
    expect(intentados).toEqual([PABLO, ROSA])
  })

  it('si fallan todos, no revienta: dice que no ha salido ninguno', async () => {
    const { send } = envio([PABLO, ROSA])

    expect(await deliverReminder([PABLO, ROSA], send)).toEqual({ sent: 0, failed: 2 })
  })

  it('sin nadie a quien avisar, no sale nada y tampoco falla nada', async () => {
    const { send } = envio()

    expect(await deliverReminder([], send)).toEqual({ sent: 0, failed: 0 })
  })
})
