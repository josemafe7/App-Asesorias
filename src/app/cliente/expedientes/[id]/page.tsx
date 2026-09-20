import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { DocumentList } from '@/components/document-list'
import { Notice } from '@/components/notice'
import { DossierPill, RequestPill } from '@/components/status-pill'
import { UploadDocumentForm } from '@/components/upload-document-form'
import { listCategories, listDocumentData } from '@/data/document-data'
import { listDocuments } from '@/data/documents'
import { getDossier } from '@/data/dossiers'
import { listRequests } from '@/data/requests'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { formatDay, isOverdue, quarterLabel, todayInSpain } from '@/lib/dates'

export const metadata: Metadata = { title: 'Trimestre · ' + APP_NAME }

// Lo que llega por la dirección también se valida, aunque sea un aviso (docs/security.md).
const searchSchema = z.object({ subido: z.literal('1').optional().catch(undefined) })

export default async function ExpedienteDelClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('client')

  const { id } = await params
  const { subido } = searchSchema.parse(await searchParams)

  // El expediente de otra empresa no lo devuelven las políticas: aquí se ve «no tienes permiso».
  const dossier = z.uuid().safeParse(id).success ? await getDossier(id) : null
  if (!dossier) redirect('/sin-permiso')

  const [requests, documents] = await Promise.all([
    listRequests(dossier.id),
    listDocuments(dossier.id),
  ])

  // R7 · Los datos de un documento solo se ven cuando está aprobado: la consulta devuelve esos y
  // ningunos más, porque así lo dice su política.
  const [datos, categories] = await Promise.all([
    listDocumentData(documents.map((document) => document.id)),
    listCategories(),
  ])

  const hoy = todayInSpain()
  const abierto = dossier.status === 'open'
  const pendientes = requests.filter((request) => request.status === 'pending')

  return (
    <AppShell profile={profile}>
      <Link
        href="/cliente"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a mi inicio
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] tabular-nums">
          {quarterLabel(dossier.year, dossier.quarter)}
        </h1>
        <DossierPill status={dossier.status} />
      </div>

      {subido ? <Notice>Documento subido. Tu asesoría ya lo tiene.</Notice> : null}

      <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Lo que te piden</h2>

        {requests.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            De este trimestre no te piden nada por ahora.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3"
              >
                <div className="min-w-[200px] flex-1">
                  <div className="text-[15px] font-medium">{request.title}</div>
                  {request.description ? (
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {request.description}
                    </div>
                  ) : null}
                </div>
                <div className="text-[15px] tabular-nums text-muted-foreground">
                  Antes del {formatDay(request.dueDate)}
                </div>
                <RequestPill
                  status={request.status}
                  overdue={request.status === 'pending' && isOverdue(request.dueDate, hoy)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Tus documentos</h2>

        {/* D7 · Mientras no esté aprobado, puede quitarlo y subir otro. */}
        <DocumentList
          documents={documents}
          canDelete={(document) => document.status !== 'approved'}
          data={datos}
          categories={categories}
        />

        <div className="mt-6 border-t pt-5">
          {abierto ? (
            <>
              <h3 className="text-[17px] font-semibold">Subir un documento</h3>
              <div className="mt-4">
                <UploadDocumentForm
                  dossierId={dossier.id}
                  requests={pendientes.map((request) => ({
                    id: request.id,
                    title: request.title,
                  }))}
                />
              </div>
            </>
          ) : (
            // E4 · Con el trimestre cerrado no se suben documentos nuevos.
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Este trimestre está cerrado: ya no se pueden subir documentos. Si te falta algo por
              entregar, habla con tu asesoría.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  )
}
