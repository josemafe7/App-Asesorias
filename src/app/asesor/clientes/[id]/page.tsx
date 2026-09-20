import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { ActivePill } from '@/components/status-pill'
import { getClient } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Cliente · ' + APP_NAME }

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
        <p className="mt-6 text-[15px] text-muted-foreground">
          Los expedientes trimestrales de este cliente llegan en la fase 3.
        </p>
      </section>
    </AppShell>
  )
}
