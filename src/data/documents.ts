import 'server-only'

import { extensionFor, type AllowedType } from '@/lib/files'
import { createClient } from '@/lib/supabase/server'

import type { SaveResult } from './result'

/**
 * Los documentos subidos (D1-D8).
 *
 * Los archivos viven en un almacén privado de Supabase (D5) y la fila de esta tabla dice de quién es
 * cada uno. Quién puede verlos, subirlos y borrarlos lo deciden las políticas, en las dos partes: en la
 * tabla y en el almacén.
 */

export const BUCKET = 'documents'

/** D6 · Cuánto vale un enlace de descarga. Lo justo para abrirlo, no para repartirlo. */
const SIGNED_URL_SECONDS = 60

export type DocumentStatus = 'uploaded' | 'reading' | 'pending_review' | 'approved' | 'rejected'

export type StoredDocument = {
  id: string
  dossierId: string
  requestId: string | null
  originalName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  status: DocumentStatus
  uploadedBy: string
  createdAt: string
}

const DOCUMENT_COLUMNS =
  'id, dossier_id, request_id, original_name, mime_type, size_bytes, storage_path, status, uploaded_by, created_at'

type DocumentRow = {
  id: string
  dossier_id: string
  request_id: string | null
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  status: DocumentStatus
  uploaded_by: string
  created_at: string
}

function toDocument(row: DocumentRow): StoredDocument {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    requestId: row.request_id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    status: row.status,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }
}

export async function listDocuments(dossierId: string): Promise<StoredDocument[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(DOCUMENT_COLUMNS)
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`No se han podido leer los documentos: ${error.message}`)

  return (data ?? []).map(toDocument)
}

export async function getDocument(id: string): Promise<StoredDocument | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(DOCUMENT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  return toDocument(data)
}

/** E5 · Cuántos documentos tiene cada expediente de la lista. */
export async function countDocumentsByDossier(dossierIds: string[]): Promise<Map<string, number>> {
  const cuenta = new Map<string, number>()
  if (dossierIds.length === 0) return cuenta

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select('dossier_id')
    .in('dossier_id', dossierIds)

  if (error) throw new Error(`No se han podido contar los documentos: ${error.message}`)

  for (const row of data ?? []) {
    cuenta.set(row.dossier_id, (cuenta.get(row.dossier_id) ?? 0) + 1)
  }

  return cuenta
}

/**
 * Guarda el archivo y su fila. Si la fila no se puede crear, el archivo no se queda suelto.
 *
 * La ruta la decide el servidor: empresa, expediente y un nombre inventado. El nombre original solo se
 * guarda para enseñarlo (docs/security.md · «Entradas y peticiones»).
 */
export async function uploadDocument(input: {
  clientId: string
  dossierId: string
  requestId: string | null
  originalName: string
  type: AllowedType
  size: number
  bytes: ArrayBuffer
  uploadedBy: string
}): Promise<SaveResult> {
  const supabase = await createClient()

  const path = `${input.clientId}/${input.dossierId}/${crypto.randomUUID()}.${extensionFor(input.type)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.bytes, { contentType: input.type, upsert: false })

  if (uploadError) {
    console.error('[documentos] no se ha podido guardar el archivo')
    return { ok: false, message: 'No se ha podido guardar el archivo. Inténtalo otra vez.' }
  }

  const { error } = await supabase.from('documents').insert({
    dossier_id: input.dossierId,
    request_id: input.requestId,
    original_name: input.originalName,
    mime_type: input.type,
    size_bytes: input.size,
    storage_path: path,
    uploaded_by: input.uploadedBy,
  })

  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    console.error('[documentos] archivo guardado sin ficha, se deshace')
    return { ok: false, message: 'No se ha podido guardar el documento. Inténtalo otra vez.' }
  }

  return { ok: true }
}

/**
 * D7 · Borra el documento y su archivo.
 *
 * Primero la fila: si las políticas no dejan (por ejemplo, un cliente con un documento ya aprobado),
 * no se borra nada y el archivo sigue donde estaba.
 */
export async function deleteDocument(document: StoredDocument): Promise<SaveResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .delete()
    .eq('id', document.id)
    .select('id')

  if (error) return { ok: false, message: 'No se ha podido borrar el documento.' }
  if (!data || data.length === 0) {
    return { ok: false, message: 'Este documento ya no se puede borrar.' }
  }

  await supabase.storage.from(BUCKET).remove([document.storagePath])

  return { ok: true }
}

/** D6 · Un enlace temporal para ver o descargar, después de comprobar el permiso. */
export async function signedUrlFor(storagePath: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

  if (error || !data) return null

  return data.signedUrl
}
