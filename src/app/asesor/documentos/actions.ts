'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { listCategories, markApproved, markRejected, saveReviewedData } from '@/data/document-data'
import { getDocument } from '@/data/documents'
import { requireRole } from '@/lib/auth-guards'
import { fieldErrorsFrom, type FormState } from '@/lib/form'
import { documentDataSchema, missingForApproval } from '@/lib/validation/document-data'

/**
 * La revisión del asesor: corregir, aprobar y rechazar (R2, R3, R4, R5, R8).
 *
 * R8 · Si el documento no es de un cliente suyo, las políticas no lo devuelven y aquí se para. Vale
 * igual aunque el botón no esté en la pantalla: una Server Action se puede llamar desde fuera.
 */

// En un archivo con 'use server' todo lo que se exporta tiene que ser una acción: por eso esto se
// queda dentro.
const MAX_REASON = 300

const rejectSchema = z.object({
  documentId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(1, { error: 'Escribe por qué lo rechazas: el cliente lo va a leer.' })
    .max(MAX_REASON, { error: `El motivo no puede pasar de ${MAX_REASON} caracteres.` }),
})

export async function saveDocumentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole('admin', 'advisor')

  const parsed = documentDataSchema.safeParse({
    documentId: String(formData.get('documentId') ?? ''),
    issueDate: String(formData.get('issueDate') ?? ''),
    supplier: String(formData.get('supplier') ?? ''),
    supplierTaxId: String(formData.get('supplierTaxId') ?? ''),
    taxBase: String(formData.get('taxBase') ?? ''),
    vatRate: String(formData.get('vatRate') ?? ''),
    vatAmount: String(formData.get('vatAmount') ?? ''),
    total: String(formData.get('total') ?? ''),
    categoryCode: String(formData.get('categoryCode') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { documentId, ...fields } = parsed.data

  const document = await getDocument(documentId)
  if (!document) return { error: 'Ese documento no está entre los tuyos.' }

  if (fields.categoryCode) {
    const categories = await listCategories()
    if (!categories.some((categoria) => categoria.code === fields.categoryCode)) {
      return { fieldErrors: { categoryCode: 'Elige una categoría de la lista.' } }
    }
  }

  const pendientes = missingForApproval(fields)

  const result = await saveReviewedData(documentId, fields, pendientes)
  if (!result.ok) return { error: result.message }

  // R3 · No se aprueba nada con campos pendientes.
  if (formData.get('intent') === 'approve') {
    if (pendientes.length > 0) {
      return { error: 'Faltan datos por rellenar: hasta que no estén, no se puede aprobar.' }
    }

    const aprobado = await markApproved(documentId, { id: profile.id, fullName: profile.fullName })
    if (!aprobado.ok) return { error: aprobado.message }
  }

  revalidatePath(`/asesor/expedientes/${document.dossierId}`)
  redirect(`/asesor/documentos/${documentId}?guardado=1`)
}

/** R5 · Rechazar indicando un motivo, que es obligatorio. */
export async function rejectDocumentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole('admin', 'advisor')

  const parsed = rejectSchema.safeParse({
    documentId: String(formData.get('documentId') ?? ''),
    reason: String(formData.get('reason') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const document = await getDocument(parsed.data.documentId)
  if (!document) return { error: 'Ese documento no está entre los tuyos.' }

  const result = await markRejected(parsed.data.documentId, parsed.data.reason)
  if (!result.ok) return { error: result.message }

  revalidatePath(`/asesor/expedientes/${document.dossierId}`)
  redirect(`/asesor/documentos/${parsed.data.documentId}?rechazado=1`)
}
