import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Panel del asesor · ' + APP_NAME }

export default async function AsesorPage() {
  // El administrador entra aquí también: la especificación le da todo lo de cualquier cliente.
  const profile = await requireRole('admin', 'advisor')

  return (
    <AppShell profile={profile}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Panel del asesor</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Aquí aparecerán tus clientes, los documentos que esperan revisión y las solicitudes vencidas. Esas
        pantallas llegan en las fases 2 y 3.
      </p>
    </AppShell>
  )
}
