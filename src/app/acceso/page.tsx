import { Folder } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/data/profile'
import { ROLE_HOME } from '@/lib/roles'
import { APP_NAME, FIRM_NAME } from '@/lib/app-config'

import { SignInForm } from './_components/sign-in-form'

export const metadata: Metadata = { title: `Acceso · ${APP_NAME}` }

export default async function AccesoPage() {
  // Quien ya ha entrado no se queda mirando la pantalla de acceso: va a su panel.
  const profile = await getCurrentProfile()
  if (profile) redirect(ROLE_HOME[profile.role])

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <Folder className="size-[22px]" strokeWidth={1.75} aria-hidden />
            <span className="text-[19px] font-semibold tracking-[-0.01em]">{APP_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground">{FIRM_NAME}</p>
        </div>

        <div className="mt-7">
          <SignInForm />
        </div>

        {/* A2 · No hay registro público: conviene decirlo, para que nadie busque un botón que no existe. */}
        <p className="mt-7 text-[13px] leading-relaxed text-muted-foreground">
          Las cuentas las crea tu asesoría. Si necesitas acceso, pídeselo a la persona que lleva tu
          expediente.
        </p>
      </div>
    </main>
  )
}
