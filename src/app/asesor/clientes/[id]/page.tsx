import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { ActivePill, DossierPill } from '@/components/status-pill'
import { getClient } from '@/data/clients'
import { listDossiers } from '@/data/dossiers'
import { countPendingByDossier } from '@/data/requests'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { quarterLabel, quarterOf, todayInSpain } from '@/lib/dates'

import { OpenDossierForm } from './_components/open-dossier-form'

export const metadata: Metadata = { title: 'Cliente · ' + APP_NAME }

/** Los años que se pueden elegir al abrir un expediente: el corriente y los dos anteriores. */
const AÑOS_ATRAS = 2

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[15px]">{value}</div>
    </div>
  )
}

export default async function ClienteDelAsesorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await requireRole('admin', 'advisor')

  const { id } = await params

  // C4 y A7 · Si no es suyo, las políticas no devuelven nada y aquí se ve «no tienes permiso», nunca el
  // contenido. Lo mismo vale para una dirección inventada.
  const client = z.uuid().safeParse(id).success ? await getClient(id) : null
  if (!client) redirect('/sin-permiso')

  const dossiers = await listDossiers(client.id)
  const pendientes = await countPendingByDossier(dossiers.map((dossier) => dossier.id))

  const hoy = todayInSpain()
  const { year, quarter } = quarterOf(hoy)
  const years = Array.from({ length: AÑOS_ATRAS + 1 }, (_, indice) => year - indice)

  return (
    <AppShell profile={profile} nav={[{ href: '/asesor', label: 'Mis clientes' }]}>
      <Link
        href="/asesor"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a mis clientes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">{client.legalName}</h1>
        <ActivePill isActive={client.isActive} />
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground tabular-nums">NIF {client.taxId}</p>

      <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Datos de contacto</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato label="Correo de contacto" value={client.email ?? 'Sin correo'} />
          <Dato label="Teléfono" value={client.phone ?? 'Sin teléfono'} />
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Expedientes trimestrales</h2>

        {dossiers.length === 0 ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Todavía no hay ningún expediente. Abre el primero eligiendo año y trimestre.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {dossiers.map((dossier) => (
              <li key={dossier.id}>
                <Link
                  href={`/asesor/expedientes/${dossier.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="text-[17px] font-semibold tabular-nums">
                    {quarterLabel(dossier.year, dossier.quarter)}
                  </span>
                  <DossierPill status={dossier.status} />
                  <span className="text-[15px] text-muted-foreground">
                    {pendientes.get(dossier.id) ?? 0} solicitudes pendientes
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t pt-5">
          <OpenDossierForm
            clientId={client.id}
            years={years}
            defaultYear={year}
            defaultQuarter={quarter}
          />
        </div>
      </section>
    </AppShell>
  )
}
