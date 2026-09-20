import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Panel del administrador · ' + APP_NAME }

export default async function AdminPage() {
  const profile = await requireRole('admin')

  return (
    <AppShell profile={profile}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Panel del administrador</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Desde aquí se dan de alta los clientes, se crean las cuentas y se reparten los clientes entre los
        asesores. Esas pantallas llegan en la fase 2.
      </p>
    </AppShell>
  )
}
