import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { DocumentList } from '@/components/document-list'
import { Notice } from '@/components/notice'
import { DossierPill, RequestPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { UploadDocumentForm } from '@/components/upload-document-form'
import { getClient } from '@/data/clients'
import { listDocuments } from '@/data/documents'
import { getDossier } from '@/data/dossiers'
import { listRequests } from '@/data/requests'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { formatDay, isOverdue, quarterLabel, todayInSpain } from '@/lib/dates'

import { toggleDossierStatusAction } from '../actions'
import { RequestForm } from '../_components/request-form'
import { CancelRequestButton } from '../_components/cancel-request-button'

export const metadata: Metadata = { title: 'Expediente · ' + APP_NAME }

// Lo que llega por la dirección también se valida, aunque sea un aviso (docs/security.md).
const searchSchema = z.object({
  creada: z.literal('1').optional().catch(undefined),
  subido: z.literal('1').optional().catch(undefined),
})

export default async function ExpedienteDelAsesorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin', 'advisor')

  const { id } = await params
  const { creada, subido } = searchSchema.parse(await searchParams)

  // R8 y C4 · Si el expediente no es de un cliente suyo, las políticas no lo devuelven: «no tienes
  // permiso», nunca el contenido.
  const dossier = z.uuid().safeParse(id).success ? await getDossier(id) : null
  if (!dossier) redirect('/sin-permiso')

  const [client, requests, documents] = await Promise.all([
    getClient(dossier.clientId),
    listRequests(dossier.id),
    listDocuments(dossier.id),
  ])

  const hoy = todayInSpain()
  const abierto = dossier.status === 'open'

  return (
    <AppShell profile={profile} nav={[{ href: '/asesor', label: 'Mis clientes' }]}>
      <Link
        href={`/asesor/clientes/${dossier.clientId}`}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver al cliente
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] tabular-nums">
          {quarterLabel(dossier.year, dossier.quarter)}
        </h1>
        <DossierPill status={dossier.status} />
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground">{client?.legalName}</p>

      {creada ? <Notice>Solicitud creada. Tu cliente ya la ve en su panel.</Notice> : null}
      {subido ? <Notice>Documento subido.</Notice> : null}

      <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Documentación pedida</h2>

        {requests.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Todavía no le has pedido nada de este trimestre.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3"
              >
                <div className="min-w-[240px] flex-1">
                  <div className="text-[15px] font-medium">{request.title}</div>
                  {request.description ? (
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {request.description}
                    </div>
                  ) : null}
                </div>
                <div className="text-[15px] tabular-nums text-muted-foreground">
                  {formatDay(request.dueDate)}
                </div>
                <RequestPill
                  status={request.status}
                  overdue={isOverdue(request.dueDate, hoy)}
                />
                {request.status === 'pending' ? (
                  <CancelRequestButton requestId={request.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t pt-5">
          <h3 className="text-[17px] font-semibold">Pedir documentación</h3>
          <div className="mt-4">
            <RequestForm dossierId={dossier.id} today={hoy} />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Documentos</h2>

        <DocumentList documents={documents} canDelete={() => true} review />

        <div className="mt-6 border-t pt-5">
          <h3 className="text-[17px] font-semibold">Subir un documento</h3>
          <div className="mt-4">
            <UploadDocumentForm
              dossierId={dossier.id}
              requests={requests
                .filter((request) => request.status === 'pending')
                .map((request) => ({ id: request.id, title: request.title }))}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Estado del expediente</h2>
        <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-muted-foreground">
          {abierto
            ? 'Está abierto: tu cliente puede subir documentos de este trimestre. Ciérralo cuando termines; podrás volver a abrirlo.'
            : 'Está cerrado: tu cliente ya no puede subir documentos de este trimestre.'}
        </p>
        <form action={toggleDossierStatusAction} className="mt-4">
          <input type="hidden" name="dossierId" value={dossier.id} />
          <input type="hidden" name="status" value={abierto ? 'closed' : 'open'} />
          <Button type="submit" variant={abierto ? 'destructive' : 'outline'} className="h-[42px] px-5">
            {abierto ? 'Cerrar expediente' : 'Volver a abrir'}
          </Button>
        </form>
      </section>
    </AppShell>
  )
}
