import { z } from 'zod'

import { getDocument, signedUrlFor } from '@/data/documents'
import { requireProfile } from '@/lib/auth-guards'

/**
 * D6 · Ver o descargar un documento.
 *
 * No hay ninguna dirección pública que muestre un archivo (D5). Esta comprueba primero quién pide, y
 * solo después pide al almacén un enlace que vale un minuto. Si quien pregunta no puede ver ese
 * documento, las políticas no lo devuelven y aquí se responde «no encontrado», sin decir si existe.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requireProfile()

  const { id } = await params
  if (!z.uuid().safeParse(id).success) return new Response('No encontrado', { status: 404 })

  const document = await getDocument(id)
  if (!document) return new Response('No encontrado', { status: 404 })

  const url = await signedUrlFor(document.storagePath)
  if (!url) return new Response('No encontrado', { status: 404 })

  return Response.redirect(url, 302)
}
