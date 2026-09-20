import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkRateLimit, peekRateLimit, resetRateLimit } from './rate-limit'

// A8 · Tras varios intentos fallidos seguidos desde el mismo sitio, la app deja de aceptar intentos
// durante un rato.
describe('límite de peticiones', () => {
  beforeEach(() => {
    vi.useRealTimers()
    resetRateLimit('prueba')
  })

  it('deja pasar hasta el límite y bloquea el siguiente', () => {
    for (let intento = 1; intento <= 5; intento += 1) {
      expect(checkRateLimit('prueba', 5, 60_000).allowed, `intento ${intento}`).toBe(true)
    }

    const bloqueado = checkRateLimit('prueba', 5, 60_000)
    expect(bloqueado.allowed).toBe(false)
    if (!bloqueado.allowed) {
      expect(bloqueado.retryAfterSeconds).toBeGreaterThan(0)
      expect(bloqueado.retryAfterSeconds).toBeLessThanOrEqual(60)
    }
  })

  it('cuenta por separado cada clave, para no castigar a un usuario por culpa de otro', () => {
    for (let intento = 1; intento <= 5; intento += 1) checkRateLimit('uno', 5, 60_000)

    expect(checkRateLimit('uno', 5, 60_000).allowed).toBe(false)
    expect(checkRateLimit('otro', 5, 60_000).allowed).toBe(true)

    resetRateLimit('uno')
    resetRateLimit('otro')
  })

  it('vuelve a dejar pasar cuando termina la ventana de tiempo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))

    for (let intento = 1; intento <= 5; intento += 1) checkRateLimit('ventana', 5, 60_000)
    expect(checkRateLimit('ventana', 5, 60_000).allowed).toBe(false)

    vi.setSystemTime(new Date('2026-09-20T10:01:01Z'))
    expect(checkRateLimit('ventana', 5, 60_000).allowed).toBe(true)

    vi.useRealTimers()
    resetRateLimit('ventana')
  })

  it('al acertar, el contador se borra y no queda penalización', () => {
    checkRateLimit('acierto', 5, 60_000)
    checkRateLimit('acierto', 5, 60_000)
    resetRateLimit('acierto')

    for (let intento = 1; intento <= 5; intento += 1) {
      expect(checkRateLimit('acierto', 5, 60_000).allowed).toBe(true)
    }
    resetRateLimit('acierto')
  })

  // A8 habla de intentos FALLIDOS. Mirar el cupo no debe gastarlo, o quien acierta a la primera se
  // acercaría al bloqueo igual que quien falla.
  it('mirar el cupo no lo gasta', () => {
    for (let vistazo = 1; vistazo <= 20; vistazo += 1) {
      expect(peekRateLimit('mirar', 5).allowed, `vistazo ${vistazo}`).toBe(true)
    }

    // Y sigue habiendo cinco intentos enteros disponibles.
    for (let intento = 1; intento <= 5; intento += 1) {
      expect(checkRateLimit('mirar', 5, 60_000).allowed).toBe(true)
    }
    expect(peekRateLimit('mirar', 5).allowed).toBe(false)

    resetRateLimit('mirar')
  })

  it('cuando el cupo está agotado, mirar dice cuánto queda', () => {
    for (let intento = 1; intento <= 5; intento += 1) checkRateLimit('agotado', 5, 60_000)

    const resultado = peekRateLimit('agotado', 5)
    expect(resultado.allowed).toBe(false)
    if (!resultado.allowed) expect(resultado.retryAfterSeconds).toBeGreaterThan(0)

    resetRateLimit('agotado')
  })
})
