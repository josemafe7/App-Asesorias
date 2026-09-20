import { z } from 'zod'

import { isDay } from '@/lib/dates'

/**
 * Los datos de un documento cuando los toca una persona (R2, R3).
 *
 * Todo es opcional mientras se corrige: se puede guardar a medias. Lo que R3 exige para **aprobar** lo
 * dice `missingForApproval`, aparte, porque guardar y aprobar no son lo mismo.
 */

const MAX_TEXT = 120
const MAX_TAX_ID = 20

/**
 * Un importe escrito como se escribe en España: «1.234,56».
 *
 * Devuelve el número, `null` si no hay nada escrito y `undefined` si lo escrito no es un importe.
 */
export function parseAmount(value: string): number | null | undefined {
  const limpio = value.trim()
  if (limpio === '') return null

  // Los puntos son separadores de miles y la coma, el decimal.
  const normalizado = limpio.replace(/\./g, '').replace(',', '.')
  const numero = Number(limpio.includes(',') ? normalizado : limpio)

  if (!Number.isFinite(numero) || numero < 0) return undefined

  return numero
}

function importe(max?: number) {
  return z.string().transform((value, ctx) => {
    const numero = parseAmount(value)

    if (numero === undefined || (numero !== null && max !== undefined && numero > max)) {
      ctx.addIssue({ code: 'custom', message: 'Escribe un importe, por ejemplo 1.234,56.' })
      return z.NEVER
    }

    return numero
  })
}

function textoOpcional(max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `No puede pasar de ${max} caracteres.` })
    .transform((value) => value || null)
}

export const documentDataSchema = z.object({
  documentId: z.uuid(),
  issueDate: z.string().transform((value, ctx) => {
    const limpio = value.trim()
    if (limpio === '') return null

    if (!isDay(limpio)) {
      ctx.addIssue({ code: 'custom', message: 'Escribe la fecha del documento.' })
      return z.NEVER
    }

    return limpio
  }),
  supplier: textoOpcional(MAX_TEXT),
  supplierTaxId: textoOpcional(MAX_TAX_ID),
  taxBase: importe(),
  vatRate: importe(100),
  vatAmount: importe(),
  total: importe(),
  categoryCode: textoOpcional(MAX_TEXT),
})

export type DocumentDataInput = z.infer<typeof documentDataSchema>

/** R3 · Lo que no puede faltar para aprobar: fecha, proveedor, base, IVA, total y categoría. */
export const REQUIRED_TO_APPROVE = [
  'issueDate',
  'supplier',
  'taxBase',
  'vatAmount',
  'total',
  'categoryCode',
] as const

export type ApprovableFields = {
  issueDate: string | null
  supplier: string | null
  supplierTaxId: string | null
  taxBase: number | null
  vatRate: number | null
  vatAmount: number | null
  total: number | null
  categoryCode: string | null
}

/** Qué campos de los obligatorios siguen vacíos. Si devuelve algo, no se aprueba (R3). */
export function missingForApproval(fields: ApprovableFields): string[] {
  return REQUIRED_TO_APPROVE.filter((campo) => fields[campo] === null)
}
