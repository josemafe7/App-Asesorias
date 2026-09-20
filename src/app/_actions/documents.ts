'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'

import { deleteDocument, getDocument, uploadDocument } from '@/data/documents'
import { getDossier } from '@/data/dossiers'
import { getRequest } from '@/data/requests'
import { processDocument } from '@/lib/ai/process-document'
import { requireProfile } from '@/lib/auth-guards'
import { checkUpload, MAX_FILE_BYTES } from '@/lib/files'
import { checkRateLimit } from '@/lib/rate-limit'
import type { FormState } from '@/lib/form'
import type { CurrentProfile } from '@/data/profile'

/**
 * Subir y borrar documentos (D1-D8).
 *
 * Están aquí, y no junto a una ruta, porque las usan dos pantallas: la del cliente y la del asesor.
 * Cada una vuelve a comprobar quién es y si ese expediente está a su alcance.
 */

// Cuántos documentos puede subir una persona en una hora.
const MAX_UPLOADS = 60
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

const uploadSchema = z.object({
  dossierId: z.uuid(),
  requestId: z
    .string()
    .transform((value) => value || null)
    .refine((value) => value === null || z.uuid().safeParse(value).success, {
      error: 'Elige una de las solicitudes.',
    }),
})

/** A dónde se vuelve después de subir o borrar. Sale del rol, nunca de lo que mande el navegador. */
function dossierPath(profile: CurrentProfile, dossierId: string): string {
  return profile.role === 'client'
    ? `/cliente/expedientes/${dossierId}`
    : `/asesor/expedientes/${dossierId}`
}

export async function uploadDocumentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile()

  const parsed = uploadSchema.safeParse({
    dossierId: String(formData.get('dossierId') ?? ''),
    requestId: String(formData.get('requestId') ?? ''),
  })
  if (!parsed.success) return { error: 'No se ha podido subir el documento.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { file: 'Elige un archivo.' } }
  }

  // El tamaño se mira antes de leer nada: así un archivo enorme no se carga en memoria.
  if (file.size > MAX_FILE_BYTES) {
    return { fieldErrors: { file: 'Solo se admiten archivos JPG, PNG, WebP o PDF de hasta 10 MB.' } }
  }

  const dossier = await getDossier(parsed.data.dossierId)
  if (!dossier) return { error: 'Ese expediente no está a tu alcance.' }

  // E4 · Con el expediente cerrado, el cliente no sube documentos nuevos. La asesoría sí.
  if (dossier.status === 'closed' && profile.role === 'client') {
    return {
      error: 'Este trimestre está cerrado. Habla con tu asesoría si te falta algo por entregar.',
    }
  }

  // D4 · Puede responder a una solicitud o no responder a ninguna, pero si responde tiene que ser a
  // una de este expediente.
  if (parsed.data.requestId) {
    const request = await getRequest(parsed.data.requestId)
    if (!request || request.dossierId !== dossier.id) {
      return { fieldErrors: { requestId: 'Elige una de las solicitudes.' } }
    }
  }

  // D2 · El tipo se decide mirando el archivo, no lo que diga el navegador.
  const bytes = await file.arrayBuffer()
  const check = checkUpload({ size: bytes.byteLength, bytes: new Uint8Array(bytes.slice(0, 16)) })
  if (!check.ok) return { fieldErrors: { file: check.message } }

  // Subir cuesta espacio y dispara una lectura de la IA: hay tope por persona y hora
  // (docs/security.md · «Límites y errores»). Se gasta aquí, cuando el archivo ya es válido.
  const limite = checkRateLimit(`subida:${profile.id}`, MAX_UPLOADS, UPLOAD_WINDOW_MS)
  if (!limite.allowed) {
    return { error: 'Has subido muchos documentos seguidos. Prueba dentro de un rato.' }
  }

  const result = await uploadDocument({
    clientId: dossier.clientId,
    dossierId: dossier.id,
    requestId: parsed.data.requestId,
    originalName: file.name,
    type: check.type,
    size: bytes.byteLength,
    bytes,
    uploadedBy: profile.id,
  })
  if (!result.ok) return { error: result.message }

  // I1 · El documento se manda a leer después de contestar: quien sube no se queda esperando a la IA.
  // I5 · Si la lectura falla o tarda, el documento ya está guardado y se queda pendiente de revisión.
  const documentId = result.id
  after(async () => {
    await processDocument({
      documentId,
      bytes,
      mimeType: check.type,
      userId: profile.id,
    })
  })

  revalidatePath(dossierPath(profile, dossier.id))
  redirect(`${dossierPath(profile, dossier.id)}?subido=1`)
}

/** D7 · Borrar un documento. El cliente, mientras no esté aprobado; eso lo decide la base de datos. */
export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const profile = await requireProfile()

  const id = z.uuid().safeParse(formData.get('documentId'))
  if (!id.success) return

  const document = await getDocument(id.data)
  if (!document) return

  await deleteDocument(document)

  revalidatePath(dossierPath(profile, document.dossierId))
}
