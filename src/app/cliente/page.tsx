import { Mail } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { DossierPill, RequestPill } from '@/components/status-pill'
import { getAdvisor, getClient } from '@/data/clients'
import { countDocumentsByDossier } from '@/data/documents'
import { listDossiers } from '@/data/dossiers'
import { countPendingByDossier, listPendingRequestsForClient } from '@/data/requests'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { formatDay, isOverdue, quarterLabel, todayInSpain } from '@/lib/dates'

export const metadata: Metadata = { title: 'Inicio · ' + APP_NAME }

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[15px]">{value}</div>
    </div>
  )
}

export default async function ClientePage() {
  const profile = await requireRole('client')

  // C7 · Cada usuario cliente pertenece a una empresa, y todos los de la misma empresa ven lo mismo.
  const client = profile.clientId ? await getClient(profile.clientId) : null
  const advisor = client?.advisorId ? await getAdvisor(client.advisorId) : null

  // S6 y E5 · Lo que le piden y sus trimestres. Las políticas ya devuelven solo lo de su empresa.
  const [pendientes, dossiers] = await Promise.all([
    listPendingRequestsForClient(),
    client ? listDossiers(client.id) : Promise.resolve([]),
  ])
  const identificadores = dossiers.map((dossier) => dossier.id)
  const [pendientesPorExpediente, documentosPorExpediente] = await Promise.all([
    countPendingByDossier(identificadores),
    countDocumentsByDossier(identificadores),
  ])

  const hoy = todayInSpain()

  return (
    <AppShell profile={profile}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Hola, {profile.fullName}</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Aquí ves lo que te pide tu asesoría y los trimestres de tu empresa.
      </p>

      <section className="mt-8 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Lo que te piden</h2>

        {pendientes.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Ahora mismo no te piden nada. Cuando tu asesoría necesite algo, aparecerá aquí.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pendientes.map((request) => (
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
                  <div className="mt-0.5 text-[13px] tabular-nums text-muted-foreground">
                    {quarterLabel(request.year, request.quarter)}
                  </div>
                </div>
                <div className="text-[15px] tabular-nums text-muted-foreground">
                  Antes del {formatDay(request.dueDate)}
                </div>
                <RequestPill status={request.status} overdue={isOverdue(request.dueDate, hoy)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Tus trimestres</h2>

        {dossiers.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Todavía no hay ningún trimestre abierto. Lo abre tu asesoría.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {dossiers.map((dossier) => (
              <li key={dossier.id}>
                <Link
                  href={`/cliente/expedientes/${dossier.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="text-[17px] font-semibold tabular-nums">
                    {quarterLabel(dossier.year, dossier.quarter)}
                  </span>
                  <DossierPill status={dossier.status} />
                  <span className="text-[15px] text-muted-foreground">
                    {documentosPorExpediente.get(dossier.id) ?? 0} documentos ·{' '}
                    {pendientesPorExpediente.get(dossier.id) ?? 0} pendientes
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {client ? (
        <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{client.legalName}</h2>
          <p className="mt-1 text-[15px] text-muted-foreground tabular-nums">NIF {client.taxId}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dato label="Correo de contacto" value={client.email ?? 'Sin correo'} />
            <Dato label="Teléfono" value={client.phone ?? 'Sin teléfono'} />
          </div>

          <div className="mt-6 border-t pt-5">
            {advisor ? (
              <>
                <p className="text-[15px]">
                  Tu asesor es <span className="font-semibold">{advisor.fullName}</span>.
                </p>
                {/* A10 · Abre el programa de correo de la persona. La app no guarda ni envía nada. */}
                <a
                  href={`mailto:${advisor.email}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-sm text-[15px] font-medium underline-offset-2 hover:text-urgent hover:underline"
                >
                  <Mail className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  Escribir a mi asesor
                </a>
              </>
            ) : (
              <p className="text-[15px] text-muted-foreground">
                Todavía no tienes asesor asignado. En cuanto la asesoría te asigne uno, aparecerá aquí.
              </p>
            )}
          </div>
        </section>
      ) : (
        <p className="mt-8 text-[15px] text-muted-foreground">
          Todavía no hay ninguna empresa asociada a tu cuenta. Avisa a tu asesoría.
        </p>
      )}
    </AppShell>
  )
}
