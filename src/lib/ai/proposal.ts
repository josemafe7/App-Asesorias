import { isDay } from '@/lib/dates'

/**
 * Lo que la IA propone de un documento, pasado por el filtro de la app (I2, I3, I4, I6).
 *
 * La regla es una sola: **nada se inventa**. Lo que no venga, no venga claro o no encaje se queda
 * vacío y marcado como pendiente, para que lo rellene una persona. Y lo que venga se trata como texto:
 * si dentro hay algo que parece una orden, acaba dentro de un campo y no pasa nada más (I6).
 */

export type RawProposal = {
  date: string | null
  supplier: string | null
  supplierTaxId: string | null
  taxBase: number | null
  vatRate: number | null
  vatAmount: number | null
  total: number | null
  category: string | null
}

export type ProposalFields = RawProposal

export type Proposal = {
  fields: ProposalFields
  /** Los campos que se quedan vacíos y hay que rellenar a mano (I2). */
  pending: (keyof ProposalFields)[]
  /** I4 · La base y la cuota no cuadran con el total: lo mira una persona. */
  needsReview: boolean
}

/** Un proveedor no se llama con una novela: lo que pase de aquí se recorta. */
const MAX_TEXT = 120

/** Los céntimos de redondeo no cuentan como descuadre. */
const TOLERANCIA_CENTIMOS = 1

const CAMPOS: (keyof ProposalFields)[] = [
  'date',
  'supplier',
  'supplierTaxId',
  'taxBase',
  'vatRate',
  'vatAmount',
  'total',
  'category',
]

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null

  const limpio = valor.trim().slice(0, MAX_TEXT)

  return limpio.length > 0 ? limpio : null
}

function importe(valor: unknown): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return null

  return valor
}

function porcentaje(valor: unknown): number | null {
  const numero = importe(valor)

  return numero !== null && numero <= 100 ? numero : null
}

function dia(valor: unknown): string | null {
  return typeof valor === 'string' && isDay(valor) ? valor : null
}

export function normalizeProposal(raw: RawProposal | null, categories: string[]): Proposal {
  const categoria = texto(raw?.category)

  const fields: ProposalFields = {
    date: dia(raw?.date),
    supplier: texto(raw?.supplier),
    supplierTaxId: texto(raw?.supplierTaxId),
    taxBase: importe(raw?.taxBase),
    vatRate: porcentaje(raw?.vatRate),
    vatAmount: importe(raw?.vatAmount),
    total: importe(raw?.total),
    // I3 · La categoría tiene que ser una de las del catálogo. Si no, se queda pendiente.
    category: categoria !== null && categories.includes(categoria) ? categoria : null,
  }

  const pending = CAMPOS.filter((campo) => fields[campo] === null)

  // I4 · Si no cuadran, se marca para revisar y no se corrige ningún importe por su cuenta.
  const cuadran =
    fields.taxBase !== null && fields.vatAmount !== null && fields.total !== null
      ? Math.round(Math.abs(fields.taxBase + fields.vatAmount - fields.total) * 100) <=
        TOLERANCIA_CENTIMOS
      : true

  return { fields, pending, needsReview: !cuadran }
}

/**
 * Cómo se llama cada campo en la pantalla de revisión y en los datos guardados.
 *
 * A la IA se le pide `date` y `category`; la app guarda y enseña `issueDate` y `categoryCode`. Si la
 * lista de pendientes se guardara con los nombres de la IA, esos dos campos saldrían vacíos pero sin
 * su marca de «pendiente» (I2).
 */
const NOMBRE_EN_LA_REVISION: Record<keyof ProposalFields, string> = {
  date: 'issueDate',
  supplier: 'supplier',
  supplierTaxId: 'supplierTaxId',
  taxBase: 'taxBase',
  vatRate: 'vatRate',
  vatAmount: 'vatAmount',
  total: 'total',
  category: 'categoryCode',
}

export function pendingFieldsForReview(pending: (keyof ProposalFields)[]): string[] {
  return pending.map((campo) => NOMBRE_EN_LA_REVISION[campo])
}
