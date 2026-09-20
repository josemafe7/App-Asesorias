import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ROLE_HOME } from '@/data/profile'
import { APP_NAME } from '@/lib/app-config'
import { requireProfile } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Sin permiso · ' + APP_NAME }

// A7 · Un mensaje corto y sin detalles tecnicos: no se dice que hay detras ni por que.
export default async function SinPermisoPage() {
  const profile = await requireProfile()

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="max-w-[420px] text-center">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Esta página no es para ti</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Tu cuenta no tiene acceso a esta parte del portal. Si crees que es un error, habla con tu
          asesoría.
        </p>
        <Button render={<Link href={ROLE_HOME[profile.role]} />} className="mt-7 h-[42px] px-5">
          Volver a mi inicio
        </Button>
      </div>
    </main>
  )
}
