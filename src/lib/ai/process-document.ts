import 'server-only'

import {
  listCategories,
  markAsReading,
  saveAiProposal,
} from '@/data/document-data'
import { checkRateLimit } from '@/lib/rate-limit'

import { normalizeProposal } from './proposal'
import { readDocument } from './read-document'

/**
 * De un archivo recién subido a unos datos propuestos (I1-I8).
 *
 * Pase lo que pase aquí, el documento no se pierde: si la IA falla, tarda o no hay cupo, se queda
 * «pendiente de revisión» con los campos vacíos y el asesor los rellena a mano (I5).
 */

// I8 · Cuántos documentos puede mandar a leer una misma persona en una hora. Cada lectura cuesta
// dinero (docs/security.md · «Límites y errores»).
const MAX_READINGS = 30
const READING_WINDOW_MS = 60 * 60 * 1000

export async function processDocument(input: {
  documentId: string
  bytes: ArrayBuffer
  mimeType: string
  userId: string
}): Promise<void> {
  const limite = checkRateLimit(`ia:${input.userId}`, MAX_READINGS, READING_WINDOW_MS)

  if (!limite.allowed) {
    console.warn('[ia] cupo de lecturas agotado', { usuario: input.userId })
    await saveAiProposal(input.documentId, normalizeProposal(null, []), null)
    return
  }

  await markAsReading(input.documentId)

  const categories = await listCategories()
  const raw = await readDocument({
    bytes: input.bytes,
    mimeType: input.mimeType,
    categories,
  })

  const proposal = normalizeProposal(
    raw,
    categories.map((categoria) => categoria.code),
  )

  await saveAiProposal(input.documentId, proposal, raw)
}
