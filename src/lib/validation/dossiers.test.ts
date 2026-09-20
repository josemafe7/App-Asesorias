import { describe, expect, it } from 'vitest'

import { dossierSchema } from './dossiers'

/**
 * E1 · El asesor abre el expediente de un cliente para un año y un trimestre concretos.
 *
 * Lo que llega de un formulario es texto, así que el esquema también se encarga de convertirlo.
 */

const EMPRESA = '11111111-1111-4111-8111-111111111111'

describe('dossierSchema', () => {
  it('acepta una empresa, un año y un trimestre correctos', () => {
    const parsed = dossierSchema.parse({ clientId: EMPRESA, year: '2026', quarter: '1' })

    expect(parsed).toEqual({ clientId: EMPRESA, year: 2026, quarter: 1 })
  })

  it('rechaza un trimestre que no existe', () => {
    for (const quarter of ['0', '5', '-1', 'T1', '']) {
      expect(dossierSchema.safeParse({ clientId: EMPRESA, year: '2026', quarter }).success).toBe(
        false,
      )
    }
  })

  it('rechaza un año imposible', () => {
    for (const year of ['1999', '2200', 'ayer', '', '2026,5']) {
      expect(dossierSchema.safeParse({ clientId: EMPRESA, year, quarter: '2' }).success).toBe(false)
    }
  })

  it('rechaza una empresa que no es un identificador', () => {
    expect(
      dossierSchema.safeParse({ clientId: 'la-espiga', year: '2026', quarter: '2' }).success,
    ).toBe(false)
  })
})
