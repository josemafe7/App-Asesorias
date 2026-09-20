import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { DossierPill, RequestPill } from '@/components/status-pill'
import { getDossier } from '@/data/dossiers'
import { listRequests } from '@/data/requests'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { formatDay, isOverdue, quarterLabel, todayInSpain } from '@/lib/dates'

export const metadata: Metadata = { title: 'Trimestre · ' + APP_NAME }

export default async function ExpedienteDelClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole('client')

  const { id } = await params

  // El expediente de otra empresa no lo devuelven las políticas: aquí se ve «no tienes permiso».
  const dossier = z.uuid().safeParse(id).success ? await getDossier(id) : null
  if (!dossier) redirect('/sin-permiso')

  const requests = await listRequests(dossier.id)
  const hoy = todayInSpain()

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
    </AppShell>
  )
}
