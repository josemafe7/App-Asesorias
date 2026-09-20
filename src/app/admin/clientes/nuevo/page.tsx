import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { ADMIN_NAV } from '../../_components/admin-nav'
import { createClientAction } from '../actions'
import { ClientForm } from '../_components/client-form'

export const metadata: Metadata = { title: 'Nuevo cliente · ' + APP_NAME }

export default async function NuevoClientePage() {
  const profile = await requireRole('admin')

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a clientes
      </Link>

      <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.02em]">Nuevo cliente</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        La razón social y el NIF son obligatorios. El asesor se asigna después, desde su ficha.
      </p>

      <div className="mt-6 max-w-[720px] rounded-xl border bg-card p-6 shadow-card">
        <ClientForm action={createClientAction} submitLabel="Dar de alta" />
      </div>
    </AppShell>
  )
}
