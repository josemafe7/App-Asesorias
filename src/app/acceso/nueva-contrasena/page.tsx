import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/app-config'
import { createClient } from '@/lib/supabase/server'

import { NewPasswordForm } from './_components/new-password-form'

export const metadata: Metadata = { title: 'Nueva contraseña · ' + APP_NAME }

export default async function NuevaContrasenaPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  // Variante del diseño: enlace caducado. Se llega aquí sin sesión cuando el enlace del correo ya no vale.
  if (!data?.claims) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px]">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">El enlace ya no vale</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Los enlaces de los correos caducan por seguridad. Pide uno nuevo y vuelve a intentarlo.
          </p>
          <Button render={<Link href="/acceso/recuperar" />} className="mt-7 h-[42px] w-full">
            Enviarme otro enlace
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Pon tu contraseña</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Elige una contraseña para entrar en {APP_NAME}.
        </p>

        <div className="mt-7">
          <NewPasswordForm />
        </div>
      </div>
    </main>
  )
}
