import { FileText } from 'lucide-react'
import Link from 'next/link'

import { DeleteDocumentButton } from '@/components/delete-document-button'
import { DocumentPill } from '@/components/status-pill'
import type { DocumentData, ExpenseCategory } from '@/data/document-data'
import type { StoredDocument } from '@/data/documents'
import { formatDay } from '@/lib/dates'

/**
 * Los documentos de un expediente, con su estado (D8) y un enlace para verlos (D6).
 *
 * La misma lista para el cliente y para la asesoría. Quién puede borrar cada uno lo decide quien la
 * usa, y en última instancia las políticas de la base de datos (D7).
 */

/** Un importe en euros, como se escribe en España. */
function euros(valor: number): string {
  return valor.toFixed(2).replace('.', ',') + ' €'
}

/** R7 · Lo que se enseña de un documento. Al cliente solo le llegan los de los aprobados. */
function resumen(data: DocumentData, categorias: Map<string, string>): string {
  return [
    data.issueDate ? formatDay(data.issueDate) : null,
    data.supplier,
    data.categoryCode ? (categorias.get(data.categoryCode) ?? null) : null,
    data.total !== null ? euros(data.total) : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function tamaño(bytes: number): string {
  const megas = bytes / (1024 * 1024)

  return megas >= 1 ? `${megas.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function DocumentList({
  documents,
  canDelete,
  review = false,
  data,
  categories = [],
}: {
  documents: StoredDocument[]
  canDelete: (document: StoredDocument) => boolean
  /** En las pantallas de la asesoría, cada documento lleva a su revisión (R1). */
  review?: boolean
  /** Los datos de cada documento, para los que quien mira puede ver. */
  data?: Map<string, DocumentData>
  categories?: ExpenseCategory[]
}) {
  if (documents.length === 0) {
    return <p className="mt-2 text-[15px] text-muted-foreground">Todavía no hay documentos.</p>
  }

  const etiquetas = new Map(categories.map((categoria) => [categoria.code, categoria.label]))

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

          {review ? (
            <Link
              href={`/asesor/documentos/${document.id}`}
              className="rounded-sm text-[15px] font-medium underline-offset-2 hover:text-urgent hover:underline"
            >
              Revisar
            </Link>
          ) : null}

          {canDelete(document) ? <DeleteDocumentButton documentId={document.id} /> : null}

          {data?.get(document.id) ? (
            <p className="w-full text-[13px] tabular-nums text-muted-foreground">
              {resumen(data.get(document.id)!, etiquetas)}
            </p>
          ) : null}

          {/* R6 · El cliente ve por qué se lo han rechazado, para subir otro en su lugar. */}
          {document.status === 'rejected' && document.rejectionReason ? (
            <p className="w-full text-[13px] text-destructive">
              Rechazado: {document.rejectionReason}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
