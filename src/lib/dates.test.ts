import { describe, expect, it } from 'vitest'

import { formatDay, isOverdue, quarterLabel, quarterOf, todayInSpain } from './dates'

describe('todayInSpain', () => {
  it('usa el día que es en España, no el del servidor', () => {
    // A las 23:30 del 31 de diciembre en horario universal, en España ya es 1 de enero.
    expect(todayInSpain(new Date('2025-12-31T23:30:00Z'))).toBe('2026-01-01')
  })

  it('devuelve el día como año-mes-día', () => {
    expect(todayInSpain(new Date('2026-03-05T10:00:00Z'))).toBe('2026-03-05')
  })
})

describe('quarterOf', () => {
  it('reparte los meses en los cuatro trimestres', () => {
    expect(quarterOf('2026-01-15')).toEqual({ year: 2026, quarter: 1 })
    expect(quarterOf('2026-03-31')).toEqual({ year: 2026, quarter: 1 })
    expect(quarterOf('2026-04-01')).toEqual({ year: 2026, quarter: 2 })
    expect(quarterOf('2026-09-30')).toEqual({ year: 2026, quarter: 3 })
    expect(quarterOf('2026-10-01')).toEqual({ year: 2026, quarter: 4 })
    expect(quarterOf('2026-12-31')).toEqual({ year: 2026, quarter: 4 })
  })
})

describe('quarterLabel', () => {
  it('se lee como lo diría una persona', () => {
    expect(quarterLabel(2026, 1)).toBe('2026 · T1')
    expect(quarterLabel(2025, 4)).toBe('2025 · T4')
  })
})

describe('formatDay', () => {
  it('escribe la fecha como se escribe en España', () => {
    expect(formatDay('2026-03-31')).toBe('31/03/2026')
  })
})

describe('isOverdue', () => {
  it('una solicitud vence al día siguiente de su fecha límite (S6)', () => {
    expect(isOverdue('2026-03-10', '2026-03-11')).toBe(true)
    expect(isOverdue('2026-03-10', '2026-03-10')).toBe(false)
    expect(isOverdue('2026-03-10', '2026-03-09')).toBe(false)
  })
})
