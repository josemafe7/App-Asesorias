import { FileText } from 'lucide-react'

import { DeleteDocumentButton } from '@/components/delete-document-button'
import { DocumentPill } from '@/components/status-pill'
import type { StoredDocument } from '@/data/documents'

/**
 * Los documentos de un expediente, con su estado (D8) y un enlace para verlos (D6).
 *
 * La misma lista para el cliente y para la asesoría. Quién puede borrar cada uno lo decide quien la
 * usa, y en última instancia las políticas de la base de datos (D7).
 */

function tamaño(bytes: number): string {
  const megas = bytes / (1024 * 1024)

  return megas >= 1 ? `${megas.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function DocumentList({
  documents,
  canDelete,
}: {
  documents: StoredDocument[]
  canDelete: (document: StoredDocument) => boolean
}) {
  if (documents.length === 0) {
    return <p className="mt-2 text-[15px] text-muted-foreground">Todavía no hay documentos.</p>
  }

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {documents.map((document) => (
        <li
          key={document.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3"
        >
          <FileText className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />

          <a
            href={`/documentos/${document.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[200px] flex-1 rounded-sm text-[15px] font-medium underline-offset-2 hover:text-urgent hover:underline"
          >
            {document.originalName}
          </a>

          <span className="text-[13px] tabular-nums text-muted-foreground">
            {tamaño(document.sizeBytes)}
          </span>

          <DocumentPill status={document.status} />

          {canDelete(document) ? <DeleteDocumentButton documentId={document.id} /> : null}
        </li>
      ))}
    </ul>
  )
}
