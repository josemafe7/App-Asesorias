import { Building2, Users } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { listAdvisors, listClients } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { ADMIN_NAV } from './_components/admin-nav'

export const metadata: Metadata = { title: 'Panel del administrador · ' + APP_NAME }

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-[40px] leading-none font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function Puerta({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string
  title: string
  description: string
  icon: typeof Users
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-card hover:bg-muted"
    >
      <Icon className="mt-0.5 size-[22px] shrink-0" strokeWidth={1.75} aria-hidden />
      <span>
        <span className="block text-[17px] font-semibold tracking-[-0.01em]">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </Link>
  )
}

export default async function AdminPage() {
  const profile = await requireRole('admin')

  const [clients, advisors] = await Promise.all([listClients({ status: 'active' }), listAdvisors()])

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Panel del administrador</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Desde aquí se dan de alta las empresas, se crean las cuentas y se reparten los clientes entre los
        asesores.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Stat label="Clientes activos" value={clients.length} />
        <Stat label="Asesores" value={advisors.length} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Puerta
          href="/admin/clientes"
          title="Clientes"
          description="Dar de alta empresas y repartirlas entre asesores"
          icon={Building2}
        />
        <Puerta
          href="/admin/usuarios"
          title="Usuarios"
          description="Invitar personas y gestionar sus accesos"
          icon={Users}
        />
      </div>
    </AppShell>
  )
}
