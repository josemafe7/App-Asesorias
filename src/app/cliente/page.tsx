import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Inicio · ' + APP_NAME }

export default async function ClientePage() {
  const profile = await requireRole('client')

  return (
    <AppShell profile={profile}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Hola, {profile.fullName}</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Aquí verás lo que te pide tu asesoría y podrás subir tus facturas y tickets del trimestre. Esas
        pantallas llegan en las fases 3 y 4.
      </p>
    </AppShell>
  )
}
