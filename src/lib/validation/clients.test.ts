import { describe, expect, it } from 'vitest'

import { clientSchema } from './clients'

/**
 * Reglas de docs/spec.md que se comprueban aquí:
 * C1 · La razón social y el NIF son obligatorios; el correo y el teléfono, no.
 * C2 · No se pueden dar de alta dos clientes con el mismo NIF.
 */

const valid = {
  legalName: 'Panadería La Espiga SL',
  taxId: 'B12345678',
  email: 'pan@laespiga.es',
  phone: '963 112 233',
}

describe('datos de un cliente', () => {
  it('C1 · acepta un alta con los cuatro datos', () => {
    const parsed = clientSchema.safeParse(valid)

    expect(parsed.success).toBe(true)
    expect(parsed.data).toEqual(valid)
  })

  it('C1 · el correo y el teléfono se pueden dejar en blanco', () => {
    const parsed = clientSchema.safeParse({ ...valid, email: '', phone: '' })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.email).toBeNull()
    expect(parsed.data?.phone).toBeNull()
  })

  it('C1 · sin razón social no se puede dar de alta', () => {
    const parsed = clientSchema.safeParse({ ...valid, legalName: '   ' })

    expect(parsed.success).toBe(false)
  })

  it('C1 · sin NIF no se puede dar de alta', () => {
    const parsed = clientSchema.safeParse({ ...valid, taxId: '' })

    expect(parsed.success).toBe(false)
  })

  it('C2 · el NIF se guarda en mayúsculas y sin espacios sobrantes', () => {
    // Si no se normalizara, «b12345678 » entraría como una empresa distinta de «B12345678».
    const parsed = clientSchema.safeParse({ ...valid, taxId: '  b12345678 ' })

    expect(parsed.data?.taxId).toBe('B12345678')
  })

  it('un correo que no lo es se rechaza', () => {
    const parsed = clientSchema.safeParse({ ...valid, email: 'esto-no-es-un-correo' })

    expect(parsed.success).toBe(false)
  })

  it('la razón social se guarda sin espacios a los lados', () => {
    const parsed = clientSchema.safeParse({ ...valid, legalName: '  Talleres Moreno SL  ' })

    expect(parsed.data?.legalName).toBe('Talleres Moreno SL')
  })
})
