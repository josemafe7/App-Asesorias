import { describe, expect, it } from 'vitest'

import { buildRequestSchema } from './requests'

/**
 * S1 · El título y la fecha límite son obligatorios; la descripción, no.
 * S2 · La fecha límite no puede ser anterior a hoy en el momento de crear la solicitud.
 *
 * El día de hoy se le pasa al esquema en vez de mirarlo él: así la prueba no depende de cuándo se
 * ejecute, y el servidor puede decidir que «hoy» es el día que es en España.
 */

const HOY = '2026-03-10'
const EXPEDIENTE = '22222222-2222-4222-8222-222222222222'

const schema = buildRequestSchema(HOY)

function solicitud(cambios: Record<string, string> = {}) {
  return {
    dossierId: EXPEDIENTE,
    title: 'Facturas de compras de marzo',
    description: '',
    dueDate: '2026-03-31',
    ...cambios,
  }
}

describe('buildRequestSchema', () => {
  it('acepta una solicitud con título y fecha límite', () => {
    const parsed = schema.parse(solicitud())

    expect(parsed).toEqual({
      dossierId: EXPEDIENTE,
      title: 'Facturas de compras de marzo',
      description: null,
      dueDate: '2026-03-31',
    })
  })

  it('guarda la descripción cuando la hay, sin espacios de sobra', () => {
    const parsed = schema.parse(solicitud({ description: '  Las del proveedor nuevo  ' }))

    expect(parsed.description).toBe('Las del proveedor nuevo')
  })

  it('rechaza una solicitud sin título (S1)', () => {
    expect(schema.safeParse(solicitud({ title: '' })).success).toBe(false)
    expect(schema.safeParse(solicitud({ title: '   ' })).success).toBe(false)
  })

  it('rechaza un título larguísimo', () => {
    expect(schema.safeParse(solicitud({ title: 'x'.repeat(121) })).success).toBe(false)
  })

  it('rechaza una fecha límite de ayer (S2)', () => {
    const result = schema.safeParse(solicitud({ dueDate: '2026-03-09' }))

    expect(result.success).toBe(false)
  })

  it('acepta la fecha límite de hoy mismo (S2)', () => {
    expect(schema.safeParse(solicitud({ dueDate: HOY })).success).toBe(true)
  })

  it('rechaza una fecha que no es una fecha', () => {
    for (const dueDate of ['', '31/03/2026', '2026-13-01', 'mañana']) {
      expect(schema.safeParse(solicitud({ dueDate })).success).toBe(false)
    }
  })

  it('rechaza un expediente que no es un identificador', () => {
    expect(schema.safeParse(solicitud({ dossierId: 'el-de-la-espiga' })).success).toBe(false)
  })
})
