import { describe, expect, it } from 'vitest'

import { canSendReminder, REMINDER_COOLDOWN_MS } from './reminders'

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
