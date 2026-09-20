import { describe, expect, it } from 'vitest'

import { documentDataSchema, missingForApproval, parseAmount } from './document-data'

/**
 * Lo que el asesor corrige antes de aprobar (R2, R3).
 *
 * Los importes se escriben como se escriben en España: «1.234,56». Y para aprobar no puede faltar
 * ninguno de los campos que dice R3.
 */

const DOCUMENTO = '33333333-3333-4333-8333-333333333333'

function formulario(cambios: Record<string, string> = {}) {
  return {
    documentId: DOCUMENTO,
    issueDate: '2026-03-15',
    supplier: 'Iberdrola Clientes SAU',
    supplierTaxId: 'A95758389',
    taxBase: '100',
    vatRate: '21',
    vatAmount: '21',
    total: '121',
    categoryCode: 'suministros',
    ...cambios,
  }
}

describe('parseAmount', () => {
  it('entiende los importes como se escriben en España', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('12,50')).toBe(12.5)
    expect(parseAmount('100')).toBe(100)
    expect(parseAmount('12.50')).toBe(12.5)
  })

  it('deja vacío lo que no es un importe', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
    expect(parseAmount('cien euros')).toBeUndefined()
    expect(parseAmount('-5')).toBeUndefined()
  })
})

describe('documentDataSchema', () => {
  it('acepta los datos de una factura corriente', () => {
    const parsed = documentDataSchema.parse(formulario())

    expect(parsed.taxBase).toBe(100)
    expect(parsed.total).toBe(121)
    expect(parsed.supplier).toBe('Iberdrola Clientes SAU')
  })

  it('deja en blanco lo que no se rellena, sin inventar nada', () => {
    const parsed = documentDataSchema.parse(
      formulario({ supplierTaxId: '', vatRate: '', supplier: '  ' }),
    )

    expect(parsed.supplierTaxId).toBeNull()
    expect(parsed.vatRate).toBeNull()
    expect(parsed.supplier).toBeNull()
  })

  it('rechaza lo que no es una fecha ni un importe', () => {
    expect(documentDataSchema.safeParse(formulario({ issueDate: '15/03/2026' })).success).toBe(false)
    expect(documentDataSchema.safeParse(formulario({ total: 'ciento veinte' })).success).toBe(false)
    expect(documentDataSchema.safeParse(formulario({ vatRate: '150' })).success).toBe(false)
  })
})

describe('missingForApproval', () => {
  const completo = {
    issueDate: '2026-03-15',
    supplier: 'Iberdrola Clientes SAU',
    supplierTaxId: null,
    taxBase: 100,
    vatRate: null,
    vatAmount: 21,
    total: 121,
    categoryCode: 'suministros',
  }

  it('R3 · con todo lo obligatorio relleno, no falta nada', () => {
    expect(missingForApproval(completo)).toEqual([])
  })

  it('R3 · dice qué falta cuando falta algo', () => {
    expect(missingForApproval({ ...completo, supplier: null })).toEqual(['supplier'])
    expect(missingForApproval({ ...completo, total: null })).toEqual(['total'])
    expect(missingForApproval({ ...completo, issueDate: null, taxBase: null })).toEqual([
      'issueDate',
      'taxBase',
    ])
    expect(missingForApproval({ ...completo, categoryCode: null })).toEqual(['categoryCode'])
    expect(missingForApproval({ ...completo, vatAmount: null })).toEqual(['vatAmount'])
  })

  it('el NIF del proveedor y el tipo de IVA no impiden aprobar', () => {
    expect(missingForApproval({ ...completo, supplierTaxId: null, vatRate: null })).toEqual([])
  })
})
