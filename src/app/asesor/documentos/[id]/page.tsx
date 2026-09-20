import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { Notice } from '@/components/notice'
import { DocumentPill } from '@/components/status-pill'
import { getDocumentData, listCategories } from '@/data/document-data'
import { getDocument } from '@/data/documents'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { RejectForm } from '../_components/reject-form'
import { ReviewForm, type ReviewDefaults } from '../_components/review-form'

export const metadata: Metadata = { title: 'Revisar documento · ' + APP_NAME }

// Lo que llega por la dirección también se valida, aunque sea un aviso (docs/security.md).
const searchSchema = z.object({
  guardado: z.literal('1').optional().catch(undefined),
  rechazado: z.literal('1').optional().catch(undefined),
})

/** Los importes se enseñan como se escriben en España, y así vuelven al formulario. */
function importe(valor: number | null): string {
  return valor === null ? '' : String(valor).replace('.', ',')
}

export default async function RevisarDocumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin', 'advisor')

  const { id } = await params
  const { guardado, rechazado } = searchSchema.parse(await searchParams)

  // R8 · Un asesor no abre el documento de un cliente que no tiene asignado: las políticas no lo
  // devuelven y aquí se ve «no tienes permiso», nunca el contenido.
  const document = z.uuid().safeParse(id).success ? await getDocument(id) : null
  if (!document) redirect('/sin-permiso')

  const [data, categories] = await Promise.all([getDocumentData(document.id), listCategories()])

  const defaults: ReviewDefaults = {
    issueDate: data?.issueDate ?? '',
    supplier: data?.supplier ?? '',
    supplierTaxId: data?.supplierTaxId ?? '',
    taxBase: importe(data?.taxBase ?? null),
    vatRate: importe(data?.vatRate ?? null),
    vatAmount: importe(data?.vatAmount ?? null),
    total: importe(data?.total ?? null),
    categoryCode: data?.categoryCode ?? '',
  }

  const esImagen = document.mimeType.startsWith('image/')
  const aprobado = document.status === 'approved'

  return (
    <AppShell profile={profile} nav={[{ href: '/asesor', label: 'Mis clientes' }]}>
      <Link
        href={`/asesor/expedientes/${document.dossierId}`}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver al expediente
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">{document.originalName}</h1>
        <DocumentPill status={document.status} />
      </div>

      {guardado ? <Notice>Datos guardados.</Notice> : null}
      {rechazado ? <Notice>Documento rechazado. Tu cliente ya ve el motivo.</Notice> : null}
      {data?.needsReview ? (
        <p className="mt-4 rounded-md border border-urgent bg-card px-4 py-3 text-[15px] text-urgent">
          La base y el IVA no cuadran con el total. Míralo antes de aprobar: la app no ha corregido
          ningún importe.
        </p>
      ) : null}
      {document.status === 'rejected' && document.rejectionReason ? (
        <p className="mt-4 text-[15px] text-muted-foreground">
          Rechazado: {document.rejectionReason}
        </p>
      ) : null}

      {/* R1 · El archivo a un lado y los datos al otro. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 shadow-card">
          {esImagen ? (
            // El archivo llega por un enlace temporal del almacén privado: no es un recurso del
            // proyecto que Next pueda optimizar.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/documentos/${document.id}`}
              alt={`Documento ${document.originalName}`}
              className="h-[640px] w-full rounded-lg object-contain"
            />
          ) : (
            <iframe
              src={`/documentos/${document.id}`}
              title={`Documento ${document.originalName}`}
              className="h-[640px] w-full rounded-lg border"
            />
          )}
          <a
            href={`/documentos/${document.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-sm text-[15px] font-medium underline-offset-2 hover:text-urgent hover:underline"
          >
            Abrir el archivo aparte
          </a>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Datos del documento</h2>
            <div className="mt-4">
              <ReviewForm
                documentId={document.id}
                defaults={defaults}
                pendingFields={data?.pendingFields ?? []}
                categories={categories}
                aprobado={aprobado}
              />
            </div>
          </section>

          {aprobado ? null : (
            <section className="rounded-xl border bg-card p-6 shadow-card">
              <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Rechazar</h2>
              <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
                Si el archivo no sirve (borroso, cortado, no es lo que pedías), recházalo con un
                motivo y el cliente podrá subir otro en su lugar.
              </p>
              <div className="mt-4">
                <RejectForm documentId={document.id} />
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
