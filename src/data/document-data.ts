import 'server-only'

import { pendingFieldsForReview, type Proposal, type RawProposal } from '@/lib/ai/proposal'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import type { SaveResult } from './result'

/**
 * Los datos de un documento: lo que propuso la IA y lo que el asesor da por bueno (I1-I7, R3, R4).
 *
 * Leer pasa por las políticas de siempre, así que el cliente solo ve los datos de sus documentos
 * aprobados (R7). Guardar lo que propone la IA es lo único que se hace con la clave secreta: lo escribe
 * la app, no una persona, y el usuario que ha subido el documento no puede tocarlo
 * (docs/decisions/0006-la-ia-escribe-con-la-clave-secreta.md).
 */

export type DocumentData = {
  documentId: string
  issueDate: string | null
  supplier: string | null
  supplierTaxId: string | null
  taxBase: number | null
  vatRate: number | null
  vatAmount: number | null
  total: number | null
  categoryCode: string | null
  pendingFields: string[]
  needsReview: boolean
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
}

export type ExpenseCategory = { code: string; label: string }

const DATA_COLUMNS =
  'document_id, issue_date, supplier, supplier_tax_id, tax_base, vat_rate, vat_amount, total, category_code, pending_fields, needs_review, approved_by, approved_by_name, approved_at'

type DataRow = {
  document_id: string
  issue_date: string | null
  supplier: string | null
  supplier_tax_id: string | null
  tax_base: number | null
  vat_rate: number | null
  vat_amount: number | null
  total: number | null
  category_code: string | null
  pending_fields: string[]
  needs_review: boolean
  approved_by: string | null
  approved_by_name: string | null
  approved_at: string | null
}

function toData(row: DataRow): DocumentData {
  return {
    documentId: row.document_id,
    issueDate: row.issue_date,
    supplier: row.supplier,
    supplierTaxId: row.supplier_tax_id,
    taxBase: row.tax_base,
    vatRate: row.vat_rate,
    vatAmount: row.vat_amount,
    total: row.total,
    categoryCode: row.category_code,
    pendingFields: row.pending_fields,
    needsReview: row.needs_review,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    approvedAt: row.approved_at,
  }
}

/** I3 · El catálogo de categorías, que viene cargado por migración. */
export async function listCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expense_categories')
    .select('code, label')
    .order('sort_order')

  if (error) throw new Error(`No se han podido leer las categorías: ${error.message}`)

  return data ?? []
}

export async function getDocumentData(documentId: string): Promise<DocumentData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_data')
    .select(DATA_COLUMNS)
    .eq('document_id', documentId)
    .maybeSingle()

  if (error || !data) return null

  return toData(data)
}

/** Los datos de varios documentos de golpe, para pintar una lista sin una consulta por fila. */
export async function listDocumentData(documentIds: string[]): Promise<Map<string, DocumentData>> {
  const porDocumento = new Map<string, DocumentData>()
  if (documentIds.length === 0) return porDocumento

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_data')
    .select(DATA_COLUMNS)
    .in('document_id', documentIds)

  if (error) throw new Error(`No se han podido leer los datos: ${error.message}`)

  for (const row of data ?? []) porDocumento.set(row.document_id, toData(row))

  return porDocumento
}

/** El documento pasa a «leyéndose» mientras la IA lo mira (D8). */
export async function markAsReading(documentId: string): Promise<void> {
  const admin = createAdminClient()

  await admin.from('documents').update({ status: 'reading' }).eq('id', documentId)
}

/**
 * Guarda lo que ha propuesto la IA y deja el documento pendiente de revisión (I1, I2, I5, I7).
 *
 * Se guarda la propuesta tal cual llegó, aparte de los campos ya filtrados, para poder comparar.
 */
export async function saveAiProposal(
  documentId: string,
  proposal: Proposal,
  raw: RawProposal | null,
): Promise<void> {
  const admin = createAdminClient()

  const { error } = await admin.from('document_data').upsert(
    {
      document_id: documentId,
      issue_date: proposal.fields.date,
      supplier: proposal.fields.supplier,
      supplier_tax_id: proposal.fields.supplierTaxId,
      tax_base: proposal.fields.taxBase,
      vat_rate: proposal.fields.vatRate,
      vat_amount: proposal.fields.vatAmount,
      total: proposal.fields.total,
      category_code: proposal.fields.category,
      pending_fields: pendingFieldsForReview(proposal.pending),
      ai_proposal: raw,
      needs_review: proposal.needsReview,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'document_id' },
  )

  if (error) console.error('[ia] no se han podido guardar los datos propuestos')

  await admin.from('documents').update({ status: 'pending_review' }).eq('id', documentId)
}

/** R2 y R3 · Lo que corrige el asesor antes de aprobar. Va con su sesión: las políticas mandan. */
export async function saveReviewedData(
  documentId: string,
  fields: {
    issueDate: string | null
    supplier: string | null
    supplierTaxId: string | null
    taxBase: number | null
    vatRate: number | null
    vatAmount: number | null
    total: number | null
    categoryCode: string | null
  },
  pendingFields: string[],
): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('document_data').upsert(
    {
      document_id: documentId,
      issue_date: fields.issueDate,
      supplier: fields.supplier,
      supplier_tax_id: fields.supplierTaxId,
      tax_base: fields.taxBase,
      vat_rate: fields.vatRate,
      vat_amount: fields.vatAmount,
      total: fields.total,
      category_code: fields.categoryCode,
      pending_fields: pendingFields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'document_id' },
  )

  if (error) return { ok: false, message: 'No se han podido guardar los datos.' }

  return { ok: true }
}

/** R4 · Al aprobar se guarda quién y cuándo. El nombre se guarda además del identificador (X2). */
export async function markApproved(
  documentId: string,
  approvedBy: { id: string; fullName: string },
): Promise<SaveResult> {
  const supabase = await createClient()

  const { error: dataError } = await supabase
    .from('document_data')
    .update({
      approved_by: approvedBy.id,
      approved_by_name: approvedBy.fullName,
      approved_at: new Date().toISOString(),
    })
    .eq('document_id', documentId)

  if (dataError) return { ok: false, message: 'No se ha podido aprobar el documento.' }

  const { error } = await supabase
    .from('documents')
    .update({ status: 'approved', rejection_reason: null })
    .eq('id', documentId)

  if (error) return { ok: false, message: 'No se ha podido aprobar el documento.' }

  return { ok: true }
}

/** R5 · Rechazar con un motivo, que es obligatorio. */
export async function markRejected(documentId: string, reason: string): Promise<SaveResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', documentId)

  if (error) return { ok: false, message: 'No se ha podido rechazar el documento.' }

  return { ok: true }
}
